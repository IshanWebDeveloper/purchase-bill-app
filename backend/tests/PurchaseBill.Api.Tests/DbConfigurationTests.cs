using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PurchaseBill.Api.Data;

namespace PurchaseBill.Api.Tests;

public class DbConfigurationTests
{
    [Fact]
    public void Sql_Server_connections_retry_transient_failures()
    {
        // Uses the app's real database registration (no in-memory override). Nothing connects:
        // creating a context and asking for its execution strategy does not open a connection.
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("Jwt:Key", "integration-test-signing-key-0123456789abcdef");
            builder.UseSetting("ConnectionStrings:Default", "Server=tcp:unused.invalid,1433;Database=x;User ID=u;Password=p");
        });

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Free Azure SQL auto-pauses, so the first connection after idle fails until it resumes.
        Assert.True(db.Database.CreateExecutionStrategy().RetriesOnFailure);
    }
}
