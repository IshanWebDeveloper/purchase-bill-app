using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/purchase-bills")]
public class PurchaseBillsController(PurchaseBillService bills) : ControllerBase
{
    // JwtBearer maps the "sub" claim to NameIdentifier; fall back to the raw claim just in case.
    private string CurrentUser =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? string.Empty;

    [HttpPost]
    public async Task<ActionResult<PurchaseBillResponse>> Create(CreatePurchaseBillRequest request, CancellationToken ct)
    {
        var created = await bills.CreateAsync(CurrentUser, request, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseBillResponse>> Get(int id, CancellationToken ct)
    {
        var bill = await bills.GetAsync(CurrentUser, id, ct);
        return bill is null ? NotFound() : bill;
    }
}
