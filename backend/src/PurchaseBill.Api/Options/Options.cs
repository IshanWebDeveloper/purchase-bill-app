namespace PurchaseBill.Api.Options;

public class EnhanzerOptions
{
    public string BaseUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 60;
    public int MaxRetries { get; set; } = 2;
}

public class JwtOptions
{
    public string Issuer { get; set; } = "PurchaseBill.Api";
    public string Audience { get; set; } = "PurchaseBill.Client";
    public string Key { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 60;
}
