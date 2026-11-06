using System.Text.Json.Serialization;

namespace PurchaseBill.Api.Models;

// Request/response shapes of the Enhanzer POS Invoke endpoint (names must match the API exactly).
public class EnhanzerRequest
{
    [JsonPropertyName("API_Action")] public string ApiAction { get; set; } = "GetLoginData";
    [JsonPropertyName("Device_Id")] public string DeviceId { get; set; } = "D001";
    [JsonPropertyName("Sync_Time")] public string SyncTime { get; set; } = "";
    [JsonPropertyName("Company_Code")] public string CompanyCode { get; set; } = "";
    [JsonPropertyName("API_Body")] public EnhanzerLoginBody ApiBody { get; set; } = new();
}

public class EnhanzerLoginBody
{
    [JsonPropertyName("Username")] public string Username { get; set; } = "";
    [JsonPropertyName("Pw")] public string Pw { get; set; } = "";
}

public class EnhanzerResponse
{
    // Unknown accounts come back as HTTP 200 with Status_Code 401 and a null body.
    [JsonPropertyName("Status_Code")] public int? StatusCode { get; set; }
    [JsonPropertyName("Message")] public string? Message { get; set; }
    [JsonPropertyName("Response_Body")] public List<EnhanzerLoginResult>? ResponseBody { get; set; }
}

public class EnhanzerLoginResult
{
    [JsonPropertyName("Doc_Msg")] public string? DocMsg { get; set; }
    [JsonPropertyName("User_Display_Name")] public string? UserDisplayName { get; set; }
    [JsonPropertyName("User_Locations")] public List<EnhanzerLocation>? UserLocations { get; set; }
}

public class EnhanzerLocation
{
    [JsonPropertyName("Location_Code")] public string? LocationCode { get; set; }
    [JsonPropertyName("Location_Name")] public string? LocationName { get; set; }
}
