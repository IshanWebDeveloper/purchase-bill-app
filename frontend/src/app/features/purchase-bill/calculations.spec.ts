import { buildLineItem, margin, totalCost, totalSelling } from './calculations';

describe('purchase bill calculations', () => {
  it('Total Cost matches the assignment example (100 x 5, 20% => 400)', () => {
    expect(totalCost(100, 5, 20)).toBe(400);
  });

  it('Total Selling matches the assignment example (150 x 5 => 750)', () => {
    expect(totalSelling(150, 5)).toBe(750);
  });

  it('Margin is price minus cost', () => {
    expect(margin(150, 100)).toBe(50);
    expect(margin(10, 15)).toBe(-5);
  });

  it('handles 0% and 100% discount', () => {
    expect(totalCost(100, 5, 0)).toBe(500);
    expect(totalCost(100, 5, 100)).toBe(0);
  });

  it('rounds to 2 decimals', () => {
    expect(totalCost(10.1, 3, 15)).toBe(25.75); // 25.755 -> half away from zero
    expect(totalSelling(0.1, 3)).toBe(0.3); // not 0.30000000000000004
  });

  it('buildLineItem adds the calculated fields and keeps the inputs', () => {
    const line = buildLineItem({
      item: 'Mango',
      batchCode: 'B1',
      batchName: 'Block C',
      standardCost: 100,
      standardPrice: 150,
      qty: 5,
      freeQty: 1,
      discountPercent: 20,
    });
    expect(line).toMatchObject({ item: 'Mango', freeQty: 1, margin: 50, totalCost: 400, totalSelling: 750 });
  });
});
