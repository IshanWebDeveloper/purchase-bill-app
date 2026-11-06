using Microsoft.EntityFrameworkCore;

namespace PurchaseBill.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<LocationDetail> LocationDetails => Set<LocationDetail>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<BillItem> BillItems => Set<BillItem>();

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

        modelBuilder.Entity<Bill>(e =>
        {
            e.ToTable("Purchase_Bills");
            e.HasKey(x => x.Id);
            e.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.CreatedBy);
            e.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.BillId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BillItem>(e =>
        {
            e.ToTable("Purchase_Bill_Items");
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemName).HasMaxLength(100).IsRequired();
            e.Property(x => x.BatchCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.StandardCost).HasPrecision(18, 2);
            e.Property(x => x.StandardPrice).HasPrecision(18, 2);
            e.Property(x => x.DiscountPercent).HasPrecision(5, 2);
            e.Property(x => x.TotalCost).HasPrecision(18, 2);
            e.Property(x => x.TotalSelling).HasPrecision(18, 2);
            // Batch must be a saved location (FK to the unique Location_Code).
            e.HasOne<LocationDetail>().WithMany()
                .HasForeignKey(x => x.BatchCode)
                .HasPrincipalKey(l => l.LocationCode)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
