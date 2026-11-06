using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Options;

namespace PurchaseBill.Api.Services;

public class EnhanzerClient(HttpClient http, IOptions<EnhanzerOptions> options, ILogger<EnhanzerClient> logger) : IEnhanzerClient
{
    private readonly EnhanzerOptions _opts = options.Value;

    public async Task<EnhanzerLoginResult> LoginAsync(string email, string password, CancellationToken ct)
    {
        var request = new EnhanzerRequest
        {
            CompanyCode = email,
            ApiBody = new EnhanzerLoginBody { Username = email, Pw = password }
        };

        // The staging API is flaky: it can return HTTP 500, or HTTP 200 with Status_Code 0 and a null body,
        // and then succeed on the next call. Retry those; fail fast on a definite answer.
        for (var attempt = 0; ; attempt++)
        {
            var failure = "unknown";
            try
            {
                // Send a fixed-length body (not JsonContent): the staging API intermittently ignores
                // chunked request bodies and answers with Status_Code 0 and a null Response_Body.
                using var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                using var response = await http.PostAsync(_opts.BaseUrl, content, ct);
                if (response.IsSuccessStatusCode)
                {
                    var raw = await response.Content.ReadAsStringAsync(ct);
                    var body = JsonSerializer.Deserialize<EnhanzerResponse>(raw);

                    // Unknown accounts come back as HTTP 200 with Status_Code 401 and a null body.
                    if (body?.StatusCode is 401 or 403)
                        throw new InvalidCredentialsException();

                    var result = body?.ResponseBody?.FirstOrDefault();
                    if (result is not null)
                    {
                        if (result.UserLocations is { Count: > 0 })
                            return result;

                        // Wrong password: HTTP 200 + Doc_Msg, no locations.
                        if (string.Equals(result.DocMsg, "Invalid Login Details", StringComparison.OrdinalIgnoreCase))
                            throw new InvalidCredentialsException();

                        throw new UpstreamUnavailableException($"Enhanzer login failed: {result.DocMsg ?? "no locations returned"}");
                    }

                    failure = $"empty response (Status_Code {body?.StatusCode})";
                }
                else
                {
                    failure = $"HTTP {(int)response.StatusCode}";
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException && !ct.IsCancellationRequested)
            {
                failure = ex.GetType().Name;
            }

            logger.LogWarning("Enhanzer call failed: {Failure} (attempt {Attempt}/{Max})", failure, attempt + 1, _opts.MaxRetries + 1);
            if (attempt >= _opts.MaxRetries)
                throw new UpstreamUnavailableException($"Enhanzer is not responding properly ({failure}).");

            await Task.Delay(TimeSpan.FromSeconds(_opts.RetryDelaySeconds * (attempt + 1)), ct);
        }
    }
}
