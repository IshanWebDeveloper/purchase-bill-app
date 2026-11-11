using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PurchaseBill.Api.Data;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Tests;

/// <summary>Stands in for Enhanzer so the whole HTTP pipeline can be tested without the network.</summary>
public sealed class FakeEnhanzerClient : IEnhanzerClient
{
    public Func<string, string, EnhanzerLoginResult> Handler { get; set; } = (_, _) => Locations("Admin");

    public static EnhanzerLoginResult Locations(string displayName) => new()
    {
        UserDisplayName = displayName,
        UserLocations =
        [
            new EnhanzerLocation { LocationCode = "L1", LocationName = "Block C" },
            new EnhanzerLocation { LocationCode = "L2", LocationName = "Van 1" },
            new EnhanzerLocation { LocationCode = "L3", LocationName = "Van 1" },
        ],
    };

    public Task<EnhanzerLoginResult> LoginAsync(string email, string password, CancellationToken ct) =>
        Task.FromResult(Handler(email, password));
}

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();
    public FakeEnhanzerClient Enhanzer { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // "Testing" (not Development) so Program skips Migrate() and Swagger.
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", "integration-test-signing-key-0123456789abcdef");
        builder.UseSetting("ConnectionStrings:Default", "unused");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
            services.AddSingleton<IEnhanzerClient>(Enhanzer);
        });
    }
}

public class ApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private async Task<(HttpClient Client, LoginResponse Login)> SignedInAsync(string email = "user@example.com")
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "pw" });
        response.EnsureSuccessStatusCode();
        var login = (await response.Content.ReadFromJsonAsync<LoginResponse>(Json))!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        return (client, login);
    }

    private static object Bill(string item = "Mango", string batch = "L1") => new
    {
        items = new[]
        {
            new { item, batchCode = batch, standardCost = 100, standardPrice = 150, qty = 5, freeQty = 0, discountPercent = 20 },
        },
    };

    // ---- login ----

    [Fact]
    public async Task Login_succeeds_returns_a_token_and_saves_the_locations()
    {
        var (_, login) = await SignedInAsync();

        Assert.False(string.IsNullOrWhiteSpace(login.Token));
        Assert.Equal("Admin", login.DisplayName);
        Assert.Equal(3, login.Locations.Count); // both "Van 1" rows survive: the key is the code
        Assert.True(login.ExpiresAtUtc > DateTime.UtcNow);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await db.LocationDetails.CountAsync() >= 3);
    }

    [Fact]
    public async Task Login_with_bad_credentials_is_401_and_gives_no_token()
    {
        factory.Enhanzer.Handler = (_, _) => throw new InvalidCredentialsException();
        try
        {
            var response = await factory.CreateClient().PostAsJsonAsync("/api/auth/login", new { email = "a@b.com", password = "bad" });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.DoesNotContain("token", await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
        }
        finally { factory.Enhanzer.Handler = (_, _) => FakeEnhanzerClient.Locations("Admin"); }
    }

    [Fact]
    public async Task Login_when_Enhanzer_is_down_is_502()
    {
        factory.Enhanzer.Handler = (_, _) => throw new UpstreamUnavailableException("down");
        try
        {
            var response = await factory.CreateClient().PostAsJsonAsync("/api/auth/login", new { email = "a@b.com", password = "pw" });
            Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        }
        finally { factory.Enhanzer.Handler = (_, _) => FakeEnhanzerClient.Locations("Admin"); }
    }

    [Theory]
    [InlineData("not-an-email", "pw")]
    [InlineData("a@b.com", "")]
    [InlineData("", "")]
    public async Task Login_validates_the_request_before_calling_Enhanzer(string email, string password)
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/api/auth/login", new { email, password });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ---- authorization ----

    [Theory]
    [InlineData("GET", "/api/locations")]
    [InlineData("GET", "/api/purchase-bills/1")]
    [InlineData("POST", "/api/purchase-bills")]
    [InlineData("GET", "/api/purchase-bills")]
    [InlineData("GET", "/api/dashboard/latest-bills")]
    [InlineData("GET", "/api/dashboard/oldest-items")]
    [InlineData("GET", "/api/dashboard/item-quantities")]
    public async Task Protected_endpoints_return_401_without_a_token(string method, string url)
    {
        var response = await factory.CreateClient().SendAsync(new HttpRequestMessage(new HttpMethod(method), url));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_garbage_token_is_rejected()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "not.a.jwt");

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/locations")).StatusCode);
    }

    [Fact]
    public async Task Locations_are_returned_for_a_signed_in_user()
    {
        var (client, _) = await SignedInAsync();

        var locations = await client.GetFromJsonAsync<List<LocationDto>>("/api/locations", Json);

        Assert.Contains(locations!, l => l.LocationCode == "L1" && l.LocationName == "Block C");
    }

    // ---- purchase bills ----

    [Fact]
    public async Task Creating_a_bill_returns_201_with_server_calculated_totals()
    {
        var (client, _) = await SignedInAsync();

        var response = await client.PostAsJsonAsync("/api/purchase-bills", Bill());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var bill = (await response.Content.ReadFromJsonAsync<PurchaseBillResponse>(Json))!;
        Assert.Equal(1, bill.TotalItems);
        Assert.Equal(5, bill.TotalQuantity);
        Assert.Equal(400m, bill.Items[0].TotalCost);
        Assert.Equal(750m, bill.Items[0].TotalSelling);
    }

    [Fact]
    public async Task A_created_bill_can_be_read_back_by_its_owner()
    {
        var (client, _) = await SignedInAsync();
        var created = (await (await client.PostAsJsonAsync("/api/purchase-bills", Bill())).Content.ReadFromJsonAsync<PurchaseBillResponse>(Json))!;

        var response = await client.GetAsync($"/api/purchase-bills/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Another_user_cannot_read_a_bill_and_gets_404()
    {
        var (owner, _) = await SignedInAsync("owner@example.com");
        var created = (await (await owner.PostAsJsonAsync("/api/purchase-bills", Bill())).Content.ReadFromJsonAsync<PurchaseBillResponse>(Json))!;
        var (intruder, _) = await SignedInAsync("intruder@example.com");

        var response = await intruder.GetAsync($"/api/purchase-bills/{created.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_bills_are_rejected_with_400()
    {
        var (client, _) = await SignedInAsync();

        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/purchase-bills", new { items = Array.Empty<object>() })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/purchase-bills", Bill(item: "Pizza"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/purchase-bills", Bill(batch: "NOPE"))).StatusCode);

        var negativeQty = new { items = new[] { new { item = "Mango", batchCode = "L1", standardCost = 1, standardPrice = 1, qty = 0, freeQty = 0, discountPercent = 0 } } };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/purchase-bills", negativeQty)).StatusCode);

        var badDiscount = new { items = new[] { new { item = "Mango", batchCode = "L1", standardCost = 1, standardPrice = 1, qty = 1, freeQty = 0, discountPercent = 101 } } };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/purchase-bills", badDiscount)).StatusCode);
    }

    // ---- dashboard ----

    private static object BillOf(params (string Item, int Qty)[] lines) => new
    {
        items = lines.Select(l => new { item = l.Item, batchCode = "L1", standardCost = 100, standardPrice = 150, qty = l.Qty, freeQty = 0, discountPercent = 20 }).ToArray(),
    };

    private static async Task<int> PostBillAsync(HttpClient client, object bill)
    {
        var response = await client.PostAsJsonAsync("/api/purchase-bills", bill);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PurchaseBillResponse>(Json))!.Id;
    }

    [Fact]
    public async Task Latest_bills_are_the_newest_five_with_net_amount_and_item_count()
    {
        var (client, _) = await SignedInAsync("latest@example.com");
        var ids = new List<int>();
        for (var n = 1; n <= 6; n++)
            ids.Add(await PostBillAsync(client, BillOf(("Mango", 5), ("Apple", n))));

        var latest = (await client.GetFromJsonAsync<List<BillSummaryResponse>>("/api/dashboard/latest-bills", Json))!;

        Assert.Equal(ids.AsEnumerable().Reverse().Take(5), latest.Select(b => b.Id));
        var newest = latest[0];
        Assert.Equal(2, newest.ItemCount);
        Assert.Equal(11, newest.TotalQuantity);
        Assert.Equal(400m + 480m, newest.NetAmount); // 100 x 5 and 100 x 6, both less 20%
    }

    [Fact]
    public async Task Oldest_items_are_the_first_ten_lines_in_the_order_they_were_saved()
    {
        var (client, _) = await SignedInAsync("oldest@example.com");
        var first = await PostBillAsync(client, BillOf(("Mango", 1), ("Apple", 2), ("Banana", 3), ("Orange", 4)));
        var second = await PostBillAsync(client, BillOf(("Grapes", 5), ("Kiwi", 6), ("Strawberry", 7), ("Mango", 8)));
        var third = await PostBillAsync(client, BillOf(("Apple", 9), ("Banana", 10), ("Orange", 11), ("Grapes", 12)));

        var oldest = (await client.GetFromJsonAsync<List<BillItemSummaryResponse>>("/api/dashboard/oldest-items", Json))!;

        Assert.Equal(Enumerable.Range(1, 10), oldest.Select(i => i.Qty));
        Assert.Equal([first, first, first, first, second, second, second, second, third, third], oldest.Select(i => i.BillId));
        Assert.Equal("Mango", oldest[0].ItemName);
    }

    [Fact]
    public async Task Item_quantities_are_grouped_by_item_name_largest_first()
    {
        var (client, _) = await SignedInAsync("donut@example.com");
        await PostBillAsync(client, BillOf(("Mango", 5), ("Apple", 2)));
        await PostBillAsync(client, BillOf(("mango", 3), ("Kiwi", 4)));

        var totals = (await client.GetFromJsonAsync<List<ItemQuantityResponse>>("/api/dashboard/item-quantities", Json))!;

        Assert.Equal(
            [new ItemQuantityResponse("Mango", 8), new ItemQuantityResponse("Kiwi", 4), new ItemQuantityResponse("Apple", 2)],
            totals);
    }

    [Fact]
    public async Task Dashboard_and_bill_list_only_show_the_callers_own_bills()
    {
        var (owner, _) = await SignedInAsync("dash-owner@example.com");
        await PostBillAsync(owner, BillOf(("Mango", 5)));
        var (other, _) = await SignedInAsync("dash-other@example.com");

        Assert.Empty((await other.GetFromJsonAsync<List<BillSummaryResponse>>("/api/dashboard/latest-bills", Json))!);
        Assert.Empty((await other.GetFromJsonAsync<List<BillItemSummaryResponse>>("/api/dashboard/oldest-items", Json))!);
        Assert.Empty((await other.GetFromJsonAsync<List<ItemQuantityResponse>>("/api/dashboard/item-quantities", Json))!);
        Assert.Empty((await other.GetFromJsonAsync<List<BillSummaryResponse>>("/api/purchase-bills", Json))!);
        Assert.Single((await owner.GetFromJsonAsync<List<BillSummaryResponse>>("/api/purchase-bills", Json))!);
    }

    [Fact]
    public async Task Take_is_clamped_to_the_allowed_range()
    {
        var (client, _) = await SignedInAsync("clamp@example.com");
        await PostBillAsync(client, BillOf(("Mango", 1)));
        await PostBillAsync(client, BillOf(("Apple", 1)));

        Assert.Single((await client.GetFromJsonAsync<List<BillSummaryResponse>>("/api/dashboard/latest-bills?take=0", Json))!);
        Assert.Equal(2, (await client.GetFromJsonAsync<List<BillSummaryResponse>>("/api/purchase-bills?take=1000", Json))!.Count);
    }
}
