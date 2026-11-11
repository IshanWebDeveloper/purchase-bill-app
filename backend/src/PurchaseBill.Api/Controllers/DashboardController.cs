using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Controllers;

/// <summary>One endpoint per dashboard widget, so each card loads (and fails) on its own.</summary>
[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController(DashboardService dashboard) : ControllerBase
{
    [HttpGet("latest-bills")]
    public Task<IReadOnlyList<BillSummaryResponse>> LatestBills(CancellationToken ct, [FromQuery] int take = 5) =>
        dashboard.LatestBillsAsync(User.UserId(), take, ct);

    [HttpGet("oldest-items")]
    public Task<IReadOnlyList<BillItemSummaryResponse>> OldestItems(CancellationToken ct, [FromQuery] int take = 10) =>
        dashboard.OldestItemsAsync(User.UserId(), take, ct);

    [HttpGet("item-quantities")]
    public Task<IReadOnlyList<ItemQuantityResponse>> ItemQuantities(CancellationToken ct) =>
        dashboard.ItemQuantitiesAsync(User.UserId(), ct);
}
