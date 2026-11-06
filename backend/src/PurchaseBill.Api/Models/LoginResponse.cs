namespace PurchaseBill.Api.Models;

public record LoginResponse(string Token, DateTime ExpiresAtUtc, string DisplayName, IReadOnlyList<LocationDto> Locations);
