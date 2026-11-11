using System.Security.Claims;

namespace PurchaseBill.Api.Controllers;

internal static class ClaimsPrincipalExtensions
{
    /// <summary>The signed-in user's id. JwtBearer maps "sub" to NameIdentifier; fall back to the raw claim just in case.</summary>
    public static string UserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub") ?? string.Empty;
}
