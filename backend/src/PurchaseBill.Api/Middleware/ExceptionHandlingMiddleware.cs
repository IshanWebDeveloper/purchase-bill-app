using Microsoft.AspNetCore.Mvc;
using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex) when (!context.RequestAborted.IsCancellationRequested)
        {
            var (status, title) = ex switch
            {
                InvalidCredentialsException => (StatusCodes.Status401Unauthorized, "Invalid email or password."),
                UpstreamUnavailableException => (StatusCodes.Status502BadGateway, "The Enhanzer service is unavailable. Please try again."),
                _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.")
            };

            if (status >= 500) logger.LogError(ex, "Request failed");

            context.Response.StatusCode = status;
            await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title });
        }
    }
}
