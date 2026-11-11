/** One purchase bill as a row. Net Amount is the sum of its lines' Total Cost. */
export interface BillSummary {
  id: number;
  createdAtUtc: string;
  netAmount: number;
  itemCount: number;
  totalQuantity: number;
}

/** One purchase bill line, reduced to what the dashboard list shows. */
export interface BillItemSummary {
  billId: number;
  itemName: string;
  qty: number;
}

/** Total Qty for one item name across all of the user's bills. */
export interface ItemQuantity {
  itemName: string;
  totalQuantity: number;
}
