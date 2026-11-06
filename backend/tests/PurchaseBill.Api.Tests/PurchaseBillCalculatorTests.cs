using PurchaseBill.Api.Services;

namespace PurchaseBill.Api.Tests;

public class PurchaseBillCalculatorTests
{
    [Fact]
    public void TotalCost_matches_the_assignment_example()
    {
        // Standard Cost 100, Qty 5, Discount 20% => 100 x 5 less 20% = 400
        Assert.Equal(400m, PurchaseBillCalculator.TotalCost(100m, 5, 20m));
    }

    [Fact]
    public void TotalSelling_matches_the_assignment_example()
    {
        // Standard Price 150, Qty 5 => 750
        Assert.Equal(750m, PurchaseBillCalculator.TotalSelling(150m, 5));
    }

    [Theory]
    [InlineData(150, 100, 50)]
    [InlineData(10, 15, -5)]
    [InlineData(5, 5, 0)]
    public void Margin_is_price_minus_cost(decimal price, decimal cost, decimal expected) =>
        Assert.Equal(expected, PurchaseBillCalculator.Margin(price, cost));

    [Theory]
    [InlineData(100, 5, 0, 500)]
    [InlineData(100, 5, 100, 0)]
    [InlineData(0, 5, 20, 0)]
    public void TotalCost_handles_discount_boundaries(decimal cost, int qty, decimal discount, decimal expected) =>
        Assert.Equal(expected, PurchaseBillCalculator.TotalCost(cost, qty, discount));

    [Fact]
    public void TotalCost_rounds_to_two_decimals_away_from_zero()
    {
        // 10.10 x 3 less 15% = 25.755 -> 25.76
        Assert.Equal(25.76m, PurchaseBillCalculator.TotalCost(10.10m, 3, 15m));
    }
}
