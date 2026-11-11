using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/purchase-bills")]
public class PurchaseBillsController(PurchaseBillService bills, DashboardService dashboard) : ControllerBase
{
    /// <summary>The caller's bills, newest first (at most 50).</summary>
    [HttpGet]
    public Task<IReadOnlyList<BillSummaryResponse>> List(CancellationToken ct, [FromQuery] int take = 20) =>
        dashboard.LatestBillsAsync(User.UserId(), take, ct);

    [HttpPost]
    public async Task<ActionResult<PurchaseBillResponse>> Create(CreatePurchaseBillRequest request, CancellationToken ct)
    {
        var created = await bills.CreateAsync(User.UserId(), request, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseBillResponse>> Get(int id, CancellationToken ct)
    {
        var bill = await bills.GetAsync(User.UserId(), id, ct);
        return bill is null ? NotFound() : bill;
    }
}
