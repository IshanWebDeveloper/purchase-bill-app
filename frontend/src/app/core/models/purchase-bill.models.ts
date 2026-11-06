/** What the user types into the form for one line. */
export interface LineDraft {
  item: string;
  batchCode: string;
  batchName: string;
  standardCost: number;
  standardPrice: number;
  qty: number;
  freeQty: number;
  discountPercent: number;
}

/** A line in the table: the draft plus its calculated values. */
export interface LineItem extends LineDraft {
  margin: number;
  totalCost: number;
  totalSelling: number;
}

export interface CreatePurchaseBillRequest {
  items: {
    item: string;
    batchCode: string;
    standardCost: number;
    standardPrice: number;
    qty: number;
    freeQty: number;
    discountPercent: number;
  }[];
}

export interface PurchaseBillResponse {
  id: number;
  createdAtUtc: string;
  totalItems: number;
  totalQuantity: number;
}
