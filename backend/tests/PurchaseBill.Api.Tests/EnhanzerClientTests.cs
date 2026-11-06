using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PurchaseBill.Api.Options;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Tests;

public class EnhanzerClientTests
{
    private const string Success =
        """{"Status_Code":200,"Response_Body":[{"User_Display_Name":"Admin","User_Locations":[{"Location_Code":"L1","Location_Name":"Block C"},{"Location_Code":"L2","Location_Name":"Van 1"}]}]}""";

    // Enhanzer reports a wrong password as HTTP 200 + Doc_Msg and no locations.
    private const string WrongPassword = """{"Status_Code":200,"Response_Body":[{"Doc_Msg":"Invalid Login Details"}]}""";

    // An unknown account is HTTP 200 + Status_Code 401 + null body.
    private const string UnknownAccount = """{"Status_Code":401,"Message":"Un-Authorize POS API Request.","Response_Body":null}""";

    // The flaky "empty" answer the staging API gives intermittently.
    private const string Empty = """{"Status_Code":0,"Sync_Time":null,"Message":null,"Response_Body":null}""";

    private static HttpResponseMessage Json(string body, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private sealed class FakeHandler(params Func<HttpResponseMessage>[] responses) : HttpMessageHandler
    {
        private int _next;
        public int Calls => _next;
        public List<string> Bodies { get; } = [];
        public List<HttpRequestMessage> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Requests.Add(request);
            Bodies.Add(await request.Content!.ReadAsStringAsync(ct));
            // Past the scripted responses, keep repeating the last one.
            var index = Math.Min(_next++, responses.Length - 1);
            return responses[index]();
        }
    }

    private static EnhanzerClient Create(FakeHandler handler, int maxRetries = 2) =>
        new(new HttpClient(handler),
            Microsoft.Extensions.Options.Options.Create(new EnhanzerOptions
            {
                BaseUrl = "https://enhanzer.test/invoke",
                MaxRetries = maxRetries,
                RetryDelaySeconds = 0,
            }),
            NullLogger<EnhanzerClient>.Instance);

    [Fact]
    public async Task Login_returns_the_user_and_locations_on_success()
    {
        var handler = new FakeHandler(() => Json(Success));

        var result = await Create(handler).LoginAsync("a@b.com", "pw", CancellationToken.None);

        Assert.Equal("Admin", result.UserDisplayName);
        Assert.Equal(["L1", "L2"], result.UserLocations!.Select(l => l.LocationCode));
        Assert.Equal(1, handler.Calls);
    }

    [Fact]
    public async Task Login_sends_the_documented_payload_with_a_fixed_length_body()
    {
        var handler = new FakeHandler(() => Json(Success));

        await Create(handler).LoginAsync("a@b.com", "pw#1", CancellationToken.None);

        using var doc = JsonDocument.Parse(handler.Bodies[0]);
        var root = doc.RootElement;
        Assert.Equal("GetLoginData", root.GetProperty("API_Action").GetString());
        Assert.Equal("D001", root.GetProperty("Device_Id").GetString());
        Assert.Equal("", root.GetProperty("Sync_Time").GetString());
        Assert.Equal("a@b.com", root.GetProperty("Company_Code").GetString());
        Assert.Equal("a@b.com", root.GetProperty("API_Body").GetProperty("Username").GetString());
        Assert.Equal("pw#1", root.GetProperty("API_Body").GetProperty("Pw").GetString());

        // Chunked bodies make the staging API answer with an empty envelope, so a length must be sent.
        var request = handler.Requests[0];
        Assert.NotEqual(true, request.Headers.TransferEncodingChunked);
        Assert.True(request.Content!.Headers.ContentLength > 0);
    }

    [Theory]
    [InlineData(WrongPassword)]
    [InlineData(UnknownAccount)]
    public async Task Login_throws_InvalidCredentials_without_retrying(string body)
    {
        var handler = new FakeHandler(() => Json(body));

        await Assert.ThrowsAsync<InvalidCredentialsException>(() =>
            Create(handler).LoginAsync("a@b.com", "bad", CancellationToken.None));

        Assert.Equal(1, handler.Calls);
    }

    [Fact]
    public async Task Login_retries_after_an_HTTP_500_cold_start()
    {
        var handler = new FakeHandler(
            () => Json("""{"Message":"An error has occurred."}""", HttpStatusCode.InternalServerError),
            () => Json(Success));

        var result = await Create(handler).LoginAsync("a@b.com", "pw", CancellationToken.None);

        Assert.Equal("Admin", result.UserDisplayName);
        Assert.Equal(2, handler.Calls);
    }

    [Fact]
    public async Task Login_retries_after_an_empty_envelope()
    {
        var handler = new FakeHandler(() => Json(Empty), () => Json(Empty), () => Json(Success));

        var result = await Create(handler).LoginAsync("a@b.com", "pw", CancellationToken.None);

        Assert.NotNull(result.UserLocations);
        Assert.Equal(3, handler.Calls);
    }

    [Fact]
    public async Task Login_retries_after_a_timeout()
    {
        var handler = new FakeHandler(() => throw new TaskCanceledException("timeout"), () => Json(Success));

        var result = await Create(handler).LoginAsync("a@b.com", "pw", CancellationToken.None);

        Assert.Equal("Admin", result.UserDisplayName);
        Assert.Equal(2, handler.Calls);
    }

    [Fact]
    public async Task Login_gives_up_after_MaxRetries_and_reports_the_upstream_as_unavailable()
    {
        var handler = new FakeHandler(() => Json("{}", HttpStatusCode.BadGateway));

        await Assert.ThrowsAsync<UpstreamUnavailableException>(() =>
            Create(handler, maxRetries: 2).LoginAsync("a@b.com", "pw", CancellationToken.None));

        Assert.Equal(3, handler.Calls); // 1 try + 2 retries
    }

    [Fact]
    public async Task Login_does_not_swallow_a_cancellation_requested_by_the_caller()
    {
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();
        var handler = new FakeHandler(() => Json(Success));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            Create(handler).LoginAsync("a@b.com", "pw", cts.Token));
    }

    [Fact]
    public async Task Login_reports_an_unreadable_body_as_unavailable()
    {
        var handler = new FakeHandler(() => Json("<html>not json</html>"));

        await Assert.ThrowsAsync<UpstreamUnavailableException>(() =>
            Create(handler, maxRetries: 1).LoginAsync("a@b.com", "pw", CancellationToken.None));
    }
}
