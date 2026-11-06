using System.ComponentModel.DataAnnotations;

namespace PurchaseBill.Api.Models;

public class CreatePurchaseBillRequest
{
    [Required, MinLength(1), MaxLength(500)]
    public List<PurchaseBillItemRequest> Items { get; set; } = [];
}

public class PurchaseBillItemRequest
{
    [Required, StringLength(100)]
    public string Item { get; set; } = string.Empty;

    /// <summary>Location_Code of the selected Batch.</summary>
    [Required, StringLength(50)]
    public string BatchCode { get; set; } = string.Empty;

    [Range(0, 1_000_000_000)]
    public decimal StandardCost { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal StandardPrice { get; set; }

    [Range(1, 1_000_000)]
    public int Qty { get; set; }

    [Range(0, 1_000_000)]
    public int FreeQty { get; set; }

    [Range(0, 100)]
    public decimal DiscountPercent { get; set; }
}

public record PurchaseBillItemResponse(
    string Item,
    string BatchCode,
    decimal StandardCost,
    decimal StandardPrice,
    int Qty,
    int FreeQty,
    decimal DiscountPercent,
    decimal Margin,
    decimal TotalCost,
    decimal TotalSelling);

public record PurchaseBillResponse(
    int Id,
    DateTime CreatedAtUtc,
    int TotalItems,
    int TotalQuantity,
    IReadOnlyList<PurchaseBillItemResponse> Items);
