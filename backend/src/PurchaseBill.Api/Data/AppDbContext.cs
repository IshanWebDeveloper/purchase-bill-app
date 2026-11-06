using Microsoft.EntityFrameworkCore;

namespace PurchaseBill.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<LocationDetail> LocationDetails => Set<LocationDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LocationDetail>(e =>
        {
            e.ToTable("Location_Details");
            e.HasKey(x => x.Id);
            e.Property(x => x.LocationCode).HasColumnName("Location_Code").HasMaxLength(50).IsRequired();
            e.Property(x => x.LocationName).HasColumnName("Location_Name").HasMaxLength(200).IsRequired();
            // Location_Name is not unique (Van 1 appears twice), so Location_Code is the key.
            e.HasIndex(x => x.LocationCode).IsUnique();
        });
    }
}
