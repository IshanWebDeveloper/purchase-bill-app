using PurchaseBill.Api.Models;

namespace PurchaseBill.Api.Services;

public class InvalidCredentialsException() : Exception("Invalid email or password.");

public class InvalidRequestException(string message) : Exception(message);

public class UpstreamUnavailableException(string message, Exception? inner = null) : Exception(message, inner);

public interface IEnhanzerClient
{
    /// <exception cref="InvalidCredentialsException">Enhanzer rejected the credentials.</exception>
    /// <exception cref="UpstreamUnavailableException">Enhanzer failed or timed out.</exception>
    Task<EnhanzerLoginResult> LoginAsync(string email, string password, CancellationToken ct);
}
