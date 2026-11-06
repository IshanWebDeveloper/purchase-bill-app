using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/locations")]
public class LocationsController(LocationService locations) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<LocationDto>> Get(CancellationToken ct) => await locations.GetAllAsync(ct);
}
