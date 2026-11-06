using System.Net.Http.Json;
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

        using var response = await PostWithRetryAsync(request, ct);

        EnhanzerResponse? body;
        try
        {
            body = await response.Content.ReadFromJsonAsync<EnhanzerResponse>(ct);
        }
        catch (Exception ex) when (ex is JsonException or NotSupportedException)
        {
            throw new UpstreamUnavailableException("Enhanzer returned an unreadable response.", ex);
        }

        if (body?.StatusCode is 401 or 403)
            throw new InvalidCredentialsException();

        var result = body?.ResponseBody?.FirstOrDefault()
            ?? throw new UpstreamUnavailableException("Enhanzer returned an empty response.");

        // Enhanzer reports bad credentials with HTTP 200 + Doc_Msg, so check the body, not the status code.
        if (result.UserLocations is null || result.UserLocations.Count == 0)
        {
            if (string.Equals(result.DocMsg, "Invalid Login Details", StringComparison.OrdinalIgnoreCase))
                throw new InvalidCredentialsException();
            throw new UpstreamUnavailableException($"Enhanzer login failed: {result.DocMsg ?? "no locations returned"}");
        }

        return result;
    }

    // The staging API can return 500 on a cold start; a retry usually succeeds.
    private async Task<HttpResponseMessage> PostWithRetryAsync(EnhanzerRequest request, CancellationToken ct)
    {
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                var response = await http.PostAsJsonAsync(_opts.BaseUrl, request, ct);
                if (response.IsSuccessStatusCode) return response;

                var status = (int)response.StatusCode;
                response.Dispose();
                logger.LogWarning("Enhanzer returned {Status} (attempt {Attempt})", status, attempt + 1);
                if (attempt >= _opts.MaxRetries)
                    throw new UpstreamUnavailableException($"Enhanzer returned HTTP {status}.");
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Enhanzer call failed (attempt {Attempt})", attempt + 1);
                if (attempt >= _opts.MaxRetries)
                    throw new UpstreamUnavailableException("Could not reach Enhanzer.", ex);
            }

            await Task.Delay(TimeSpan.FromSeconds(2 * (attempt + 1)), ct);
        }
    }
}
