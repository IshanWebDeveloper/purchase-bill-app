namespace PurchaseBill.Api.Services;

/// <summary>The assignment's line calculations. The server recomputes these; it never trusts client totals.</summary>
public static class PurchaseBillCalculator
{
    /// <summary>Total Cost = (Standard Cost x Qty) less the discount %. Example: 100 x 5, 20% => 400.</summary>
    public static decimal TotalCost(decimal standardCost, int qty, decimal discountPercent) =>
        Math.Round(standardCost * qty * (1 - discountPercent / 100m), 2, MidpointRounding.AwayFromZero);

    /// <summary>Total Selling = Standard Price x Qty. Example: 150 x 5 => 750.</summary>
    public static decimal TotalSelling(decimal standardPrice, int qty) =>
        Math.Round(standardPrice * qty, 2, MidpointRounding.AwayFromZero);

    public static decimal Margin(decimal standardPrice, decimal standardCost) => standardPrice - standardCost;
}
