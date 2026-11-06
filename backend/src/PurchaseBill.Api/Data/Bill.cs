namespace PurchaseBill.Api.Data;

// Named Bill/BillItem (not PurchaseBill) to avoid clashing with the PurchaseBill namespace.
public class Bill
{
    public int Id { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public List<BillItem> Items { get; set; } = [];
}

public class BillItem
{
    public int Id { get; set; }
    public int BillId { get; set; }
    public string ItemName { get; set; } = string.Empty;

    /// <summary>The selected Batch: a Location_Code from Location_Details.</summary>
    public string BatchCode { get; set; } = string.Empty;

    public decimal StandardCost { get; set; }
    public decimal StandardPrice { get; set; }
    public int Qty { get; set; }
    public int FreeQty { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalSelling { get; set; }
}
