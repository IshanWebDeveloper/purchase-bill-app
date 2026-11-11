namespace PurchaseBill.Api.Models;

/// <summary>One purchase bill as a single row: Net Amount is the sum of its lines' Total Cost.</summary>
public record BillSummaryResponse(int Id, DateTime CreatedAtUtc, decimal NetAmount, int ItemCount, int TotalQuantity);

/// <summary>One purchase bill line, reduced to what the dashboard list shows.</summary>
public record BillItemSummaryResponse(int BillId, string ItemName, int Qty);

/// <summary>Total Qty for one item name across all of the user's bills.</summary>
public record ItemQuantityResponse(string ItemName, int TotalQuantity);
