using Microsoft.EntityFrameworkCore;
using PurchaseBill.Api.Data;
using PurchaseBill.Api.Models;

namespace PurchaseBill.Api.Services;

public class PurchaseBillService(AppDbContext db)
{
    // Same list the Angular autocomplete offers.
    public static readonly IReadOnlySet<string> AllowedItems = new HashSet<string>(
        ["Mango", "Apple", "Banana", "Orange", "Grapes", "Kiwi", "Strawberry"], StringComparer.OrdinalIgnoreCase);

    public async Task<PurchaseBillResponse> CreateAsync(string user, CreatePurchaseBillRequest request, CancellationToken ct)
    {
        var unknownItem = request.Items.Select(i => i.Item.Trim()).FirstOrDefault(i => !AllowedItems.Contains(i));
        if (unknownItem is not null)
            throw new InvalidRequestException($"Unknown item '{unknownItem}'.");

        var codes = request.Items.Select(i => i.BatchCode.Trim()).Distinct().ToList();
        var known = await db.LocationDetails.Where(l => codes.Contains(l.LocationCode)).Select(l => l.LocationCode).ToListAsync(ct);
        var unknownBatch = codes.Except(known).FirstOrDefault();
        if (unknownBatch is not null)
            throw new InvalidRequestException($"Unknown batch '{unknownBatch}'.");

        var bill = new Bill
        {
            CreatedBy = user,
            CreatedAtUtc = DateTime.UtcNow,
            Items = request.Items.Select(i => new BillItem
            {
                // Store the canonical spelling from the allowed list.
                ItemName = AllowedItems.First(a => a.Equals(i.Item.Trim(), StringComparison.OrdinalIgnoreCase)),
                BatchCode = i.BatchCode.Trim(),
                StandardCost = i.StandardCost,
                StandardPrice = i.StandardPrice,
                Qty = i.Qty,
                FreeQty = i.FreeQty,
                DiscountPercent = i.DiscountPercent,
                TotalCost = PurchaseBillCalculator.TotalCost(i.StandardCost, i.Qty, i.DiscountPercent),
                TotalSelling = PurchaseBillCalculator.TotalSelling(i.StandardPrice, i.Qty)
            }).ToList()
        };

        db.Bills.Add(bill); // one SaveChanges = one transaction: the bill and all its rows, or nothing
        await db.SaveChangesAsync(ct);

        return ToResponse(bill);
    }

    public async Task<PurchaseBillResponse?> GetAsync(string user, int id, CancellationToken ct)
    {
        // Scoped to the caller so one user cannot read another user's bill by guessing ids.
        var bill = await db.Bills.AsNoTracking().Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id && b.CreatedBy == user, ct);
        return bill is null ? null : ToResponse(bill);
    }

    private static PurchaseBillResponse ToResponse(Bill bill) => new(
        bill.Id,
        bill.CreatedAtUtc,
        bill.Items.Count,
        bill.Items.Sum(i => i.Qty),
        bill.Items.Select(i => new PurchaseBillItemResponse(
            i.ItemName, i.BatchCode, i.StandardCost, i.StandardPrice, i.Qty, i.FreeQty, i.DiscountPercent,
            PurchaseBillCalculator.Margin(i.StandardPrice, i.StandardCost), i.TotalCost, i.TotalSelling)).ToList());
}
