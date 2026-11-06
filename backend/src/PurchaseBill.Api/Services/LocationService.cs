using Microsoft.EntityFrameworkCore;
using PurchaseBill.Api.Data;
using PurchaseBill.Api.Models;

namespace PurchaseBill.Api.Services;

public class LocationService(AppDbContext db)
{
    public async Task UpsertAsync(IEnumerable<EnhanzerLocation> incoming, CancellationToken ct)
    {
        // Skip rows without a code and de-duplicate by code (the unique key).
        var wanted = incoming
            .Where(l => !string.IsNullOrWhiteSpace(l.LocationCode))
            .GroupBy(l => l.LocationCode!.Trim())
            .ToDictionary(g => g.Key, g => g.First().LocationName?.Trim() ?? g.Key);

        var codes = wanted.Keys.ToList();
        var existing = await db.LocationDetails
            .Where(l => codes.Contains(l.LocationCode))
            .ToDictionaryAsync(l => l.LocationCode, ct);

        foreach (var (code, name) in wanted)
        {
            if (existing.TryGetValue(code, out var row))
                row.LocationName = name;
            else
                db.LocationDetails.Add(new LocationDetail { LocationCode = code, LocationName = name });
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<LocationDto>> GetAllAsync(CancellationToken ct) =>
        await db.LocationDetails
            .AsNoTracking()
            .OrderBy(l => l.LocationName).ThenBy(l => l.LocationCode)
            .Select(l => new LocationDto(l.LocationCode, l.LocationName))
            .ToListAsync(ct);
}
