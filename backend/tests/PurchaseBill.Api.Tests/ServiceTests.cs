using Microsoft.EntityFrameworkCore;
using PurchaseBill.Api.Data;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Tests;

public class ServiceTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<AppDbContext> DbWithLocations(params (string Code, string Name)[] locations)
    {
        var db = NewDb();
        db.LocationDetails.AddRange(locations.Select(l => new LocationDetail { LocationCode = l.Code, LocationName = l.Name }));
        await db.SaveChangesAsync();
        return db;
    }

    private static PurchaseBillItemRequest Line(string item = "Mango", string batch = "L1") => new()
    {
        Item = item,
        BatchCode = batch,
        StandardCost = 100,
        StandardPrice = 150,
        Qty = 5,
        FreeQty = 1,
        DiscountPercent = 20,
    };

    // ---- LocationService ----

    [Fact]
    public async Task Upsert_inserts_new_locations_and_updates_changed_names()
    {
        await using var db = await DbWithLocations(("L1", "Old name"));
        var service = new LocationService(db);

        await service.UpsertAsync(
        [
            new EnhanzerLocation { LocationCode = "L1", LocationName = "New name" },
            new EnhanzerLocation { LocationCode = "L2", LocationName = "Block C" },
        ], CancellationToken.None);

        var all = await db.LocationDetails.OrderBy(l => l.LocationCode).ToListAsync();
        Assert.Equal(["New name", "Block C"], all.Select(l => l.LocationName));
    }

    [Fact]
    public async Task Upsert_keeps_locations_that_share_a_name_but_not_a_code()
    {
        await using var db = NewDb();

        await new LocationService(db).UpsertAsync(
        [
            new EnhanzerLocation { LocationCode = "L2", LocationName = "Van 1" },
            new EnhanzerLocation { LocationCode = "L3", LocationName = "Van 1" },
        ], CancellationToken.None);

        Assert.Equal(2, await db.LocationDetails.CountAsync());
    }

    [Fact]
    public async Task Upsert_ignores_duplicate_codes_and_blank_codes()
    {
        await using var db = NewDb();

        await new LocationService(db).UpsertAsync(
        [
            new EnhanzerLocation { LocationCode = "L1", LocationName = "A" },
            new EnhanzerLocation { LocationCode = " L1 ", LocationName = "B" },
            new EnhanzerLocation { LocationCode = "", LocationName = "No code" },
            new EnhanzerLocation { LocationCode = null, LocationName = "Null code" },
        ], CancellationToken.None);

        var saved = Assert.Single(await db.LocationDetails.ToListAsync());
        Assert.Equal("L1", saved.LocationCode);
    }

    [Fact]
    public async Task Upsert_is_idempotent()
    {
        await using var db = NewDb();
        var service = new LocationService(db);
        var incoming = new[] { new EnhanzerLocation { LocationCode = "L1", LocationName = "A" } };

        await service.UpsertAsync(incoming, CancellationToken.None);
        await service.UpsertAsync(incoming, CancellationToken.None);

        Assert.Equal(1, await db.LocationDetails.CountAsync());
    }

    // ---- PurchaseBillService ----

    [Fact]
    public async Task Create_recalculates_totals_and_stores_the_bill_for_the_user()
    {
        await using var db = await DbWithLocations(("L1", "Block C"));
        var service = new PurchaseBillService(db);

        var bill = await service.CreateAsync("a@b.com", new CreatePurchaseBillRequest { Items = [Line()] }, CancellationToken.None);

        var item = Assert.Single(bill.Items);
        Assert.Equal(400m, item.TotalCost);
        Assert.Equal(750m, item.TotalSelling);
        Assert.Equal(50m, item.Margin);
        Assert.Equal(1, bill.TotalItems);
        Assert.Equal(5, bill.TotalQuantity);
        Assert.Equal("a@b.com", (await db.Bills.SingleAsync()).CreatedBy);
    }

    [Fact]
    public async Task Create_sums_quantities_across_rows()
    {
        await using var db = await DbWithLocations(("L1", "Block C"));
        var request = new CreatePurchaseBillRequest { Items = [Line("Mango"), Line("Apple"), Line("Kiwi")] };

        var bill = await new PurchaseBillService(db).CreateAsync("a@b.com", request, CancellationToken.None);

        Assert.Equal(3, bill.TotalItems);
        Assert.Equal(15, bill.TotalQuantity);
    }

    [Fact]
    public async Task Create_stores_the_canonical_item_spelling()
    {
        await using var db = await DbWithLocations(("L1", "Block C"));

        var bill = await new PurchaseBillService(db).CreateAsync(
            "a@b.com", new CreatePurchaseBillRequest { Items = [Line("  mAnGo ")] }, CancellationToken.None);

        Assert.Equal("Mango", bill.Items[0].Item);
    }

    [Fact]
    public async Task Create_rejects_an_unknown_item_and_saves_nothing()
    {
        await using var db = await DbWithLocations(("L1", "Block C"));

        await Assert.ThrowsAsync<InvalidRequestException>(() => new PurchaseBillService(db).CreateAsync(
            "a@b.com", new CreatePurchaseBillRequest { Items = [Line("Mango"), Line("Pizza")] }, CancellationToken.None));

        Assert.Empty(db.Bills);
    }

    [Fact]
    public async Task Create_rejects_a_batch_that_is_not_a_saved_location()
    {
        await using var db = await DbWithLocations(("L1", "Block C"));

        var ex = await Assert.ThrowsAsync<InvalidRequestException>(() => new PurchaseBillService(db).CreateAsync(
            "a@b.com", new CreatePurchaseBillRequest { Items = [Line(batch: "NOPE")] }, CancellationToken.None));

        Assert.Contains("NOPE", ex.Message);
        Assert.Empty(db.Bills);
    }

    [Fact]
    public async Task Get_returns_only_the_callers_own_bill()
    {
        await using var db = await DbWithLocations(("L1", "Block C"));
        var service = new PurchaseBillService(db);
        var bill = await service.CreateAsync("owner@b.com", new CreatePurchaseBillRequest { Items = [Line()] }, CancellationToken.None);

        Assert.NotNull(await service.GetAsync("owner@b.com", bill.Id, CancellationToken.None));
        Assert.Null(await service.GetAsync("someone-else@b.com", bill.Id, CancellationToken.None));
        Assert.Null(await service.GetAsync("owner@b.com", bill.Id + 99, CancellationToken.None));
    }
}
