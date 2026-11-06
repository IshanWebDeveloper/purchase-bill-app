using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PurchaseBill.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseBills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_Location_Details_Location_Code",
                table: "Location_Details",
                column: "Location_Code");

            migrationBuilder.CreateTable(
                name: "Purchase_Bills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Purchase_Bills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Purchase_Bill_Items",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BillId = table.Column<int>(type: "int", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BatchCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StandardCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    StandardPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Qty = table.Column<int>(type: "int", nullable: false),
                    FreeQty = table.Column<int>(type: "int", nullable: false),
                    DiscountPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalSelling = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Purchase_Bill_Items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Purchase_Bill_Items_Location_Details_BatchCode",
                        column: x => x.BatchCode,
                        principalTable: "Location_Details",
                        principalColumn: "Location_Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Purchase_Bill_Items_Purchase_Bills_BillId",
                        column: x => x.BillId,
                        principalTable: "Purchase_Bills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Purchase_Bill_Items_BatchCode",
                table: "Purchase_Bill_Items",
                column: "BatchCode");

            migrationBuilder.CreateIndex(
                name: "IX_Purchase_Bill_Items_BillId",
                table: "Purchase_Bill_Items",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "IX_Purchase_Bills_CreatedBy",
                table: "Purchase_Bills",
                column: "CreatedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Purchase_Bill_Items");

            migrationBuilder.DropTable(
                name: "Purchase_Bills");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Location_Details_Location_Code",
                table: "Location_Details");
        }
    }
}
