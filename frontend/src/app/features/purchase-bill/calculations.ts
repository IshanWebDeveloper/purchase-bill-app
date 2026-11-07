import { LineDraft, LineItem } from '../../core/models/purchase-bill.models';

/** Same list the API validates against (PurchaseBillService.AllowedItems). */
export const ITEMS: readonly string[] = ['Mango', 'Apple', 'Banana', 'Orange', 'Grapes', 'Kiwi', 'Strawberry'];

/** Round to 2 decimals, half away from zero, like the API's decimal rounding. */
const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Total Cost = Standard Cost x Qty, less the discount %. Example: 100 x 5, 20% => 400. */
export function totalCost(standardCost: number, qty: number, discountPercent: number): number {
  return round2(standardCost * qty * (1 - discountPercent / 100));
}

/** Total Selling = Standard Price x Qty. Example: 150 x 5 => 750. */
export function totalSelling(standardPrice: number, qty: number): number {
  return round2(standardPrice * qty);
}

/** Margin = Standard Price - Standard Cost. */
export function margin(standardPrice: number, standardCost: number): number {
  return round2(standardPrice - standardCost);
}

export function buildLineItem(draft: LineDraft): LineItem {
  return {
    ...draft,
    margin: margin(draft.standardPrice, draft.standardCost),
    totalCost: totalCost(draft.standardCost, draft.qty, draft.discountPercent),
    totalSelling: totalSelling(draft.standardPrice, draft.qty),
  };
}

/** Bill-level figures shown in the Summary sidebar. Display only; the API recomputes what it stores. */
export interface BillTotals {
  grossTotal: number;
  itemDiscount: number;
  overallDiscount: number;
  totalDiscounts: number;
  totalBeforeTax: number;
  totalTax: number;
  suspendedTax: number;
  netTotal: number;
}

/**
 * Gross Total = sum of Standard Cost x Qty (before discount).
 * Item Discount = sum of the per-line discount amounts.
 * Total Before Tax = Gross Total - Total Discounts, so Net Total equals the sum of the rows' Total Cost.
 * There is no overall discount or tax data in this app, so those stay 0.
 */
export function billTotals(rows: readonly LineItem[]): BillTotals {
  const grossTotal = round2(rows.reduce((sum, r) => sum + r.standardCost * r.qty, 0));
  const itemDiscount = round2(rows.reduce((sum, r) => sum + (r.standardCost * r.qty * r.discountPercent) / 100, 0));
  const overallDiscount = 0;
  const totalDiscounts = round2(itemDiscount + overallDiscount);
  const totalBeforeTax = round2(grossTotal - totalDiscounts);
  const totalTax = 0;
  const suspendedTax = 0;
  const netTotal = round2(totalBeforeTax + totalTax);
  return { grossTotal, itemDiscount, overallDiscount, totalDiscounts, totalBeforeTax, totalTax, suspendedTax, netTotal };
}
