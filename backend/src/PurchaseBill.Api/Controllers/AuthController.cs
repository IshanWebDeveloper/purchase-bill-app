using Microsoft.AspNetCore.Mvc;
using PurchaseBill.Api.Models;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IEnhanzerClient enhanzer, LocationService locations, TokenService tokens) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim();
        var result = await enhanzer.LoginAsync(email, request.Password, ct);

        await locations.UpsertAsync(result.UserLocations!, ct);

        var displayName = result.UserDisplayName ?? email;
        var (token, expires) = tokens.CreateToken(email, displayName);
        var dtos = await locations.GetAllAsync(ct);

        return new LoginResponse(token, expires, displayName, dtos);
    }
}
