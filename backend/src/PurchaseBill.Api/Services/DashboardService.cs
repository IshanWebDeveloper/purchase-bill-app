using Microsoft.EntityFrameworkCore;
using PurchaseBill.Api.Data;
using PurchaseBill.Api.Models;

namespace PurchaseBill.Api.Services;

/// <summary>Read-only queries behind the dashboard widgets. Every query only sees the caller's own bills.</summary>
public class DashboardService(AppDbContext db)
{
    public const int MaxTake = 50;

    private static int Clamp(int take) => Math.Clamp(take, 1, MaxTake);

    /// <summary>Newest bills first (by creation time, then id).</summary>
    public async Task<IReadOnlyList<BillSummaryResponse>> LatestBillsAsync(string user, int take, CancellationToken ct) =>
        await db.Bills.AsNoTracking()
            .Where(b => b.CreatedBy == user)
            .OrderByDescending(b => b.CreatedAtUtc).ThenByDescending(b => b.Id)
            .Take(Clamp(take))
            .Select(b => new BillSummaryResponse(
                b.Id,
                b.CreatedAtUtc,
                b.Items.Sum(i => i.TotalCost),
                b.Items.Count,
                b.Items.Sum(i => i.Qty)))
            .ToListAsync(ct);

    /// <summary>The first lines ever saved, in insertion order.</summary>
    public async Task<IReadOnlyList<BillItemSummaryResponse>> OldestItemsAsync(string user, int take, CancellationToken ct) =>
        await db.BillItems.AsNoTracking()
            .Join(db.Bills.Where(b => b.CreatedBy == user), i => i.BillId, b => b.Id, (i, _) => i)
            .OrderBy(i => i.Id)
            .Take(Clamp(take))
            .Select(i => new BillItemSummaryResponse(i.BillId, i.ItemName, i.Qty))
            .ToListAsync(ct);

    /// <summary>Qty summed per item name, largest first.</summary>
    public async Task<IReadOnlyList<ItemQuantityResponse>> ItemQuantitiesAsync(string user, CancellationToken ct) =>
        await db.BillItems.AsNoTracking()
            .Join(db.Bills.Where(b => b.CreatedBy == user), i => i.BillId, b => b.Id, (i, _) => i)
            .GroupBy(i => i.ItemName)
            .Select(g => new { ItemName = g.Key, TotalQuantity = g.Sum(i => i.Qty) })
            .OrderByDescending(x => x.TotalQuantity).ThenBy(x => x.ItemName)
            .Select(x => new ItemQuantityResponse(x.ItemName, x.TotalQuantity))
            .ToListAsync(ct);
}
