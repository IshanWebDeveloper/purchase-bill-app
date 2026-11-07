import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BillTotals } from '../calculations';

/**
 * Summary sidebar. Total Items = number of table rows, Total Qty = sum of Qty;
 * the financial figures are derived from the rows (see `billTotals`).
 */
@Component({
  selector: 'app-summary-panel',
  imports: [DecimalPipe],
  template: `
    <h2><span class="material-symbols-outlined" aria-hidden="true">monitoring</span> Summary</h2>

    <h3><span class="material-symbols-outlined" aria-hidden="true">deployed_code</span> Item Summary <span class="material-symbols-outlined info" title="Total Items is the number of rows; Total Qty is the sum of Qty.">info</span></h3>
    <dl>
      <div>
        <dt>Total Items</dt>
        <dd data-testid="total-items">{{ totalItems() }}</dd>
      </div>
      <div>
        <dt>Total Qty</dt>
        <dd data-testid="total-quantity">{{ totalQuantity() }}</dd>
      </div>
    </dl>

    <h3><span class="material-symbols-outlined" aria-hidden="true">attach_money</span> Financial Summary</h3>
    <dl>
      <div>
        <dt>Gross Total</dt>
        <dd data-testid="gross-total">{{ totals().grossTotal | number: '1.2-2' }}</dd>
      </div>
      <div>
        <dt>Item Discount</dt>
        <dd data-testid="item-discount">{{ totals().itemDiscount | number: '1.2-2' }}</dd>
      </div>
      <div>
        <dt>Overall Discount <span class="material-symbols-outlined info" title="Overall discount is not captured in this app.">add_circle</span></dt>
        <dd>{{ totals().overallDiscount | number: '1.2-2' }}</dd>
      </div>
      <div>
        <dt>Total Discounts</dt>
        <dd>{{ totals().totalDiscounts | number: '1.2-2' }}</dd>
      </div>
      <div>
        <dt>Total Before Tax</dt>
        <dd>{{ totals().totalBeforeTax | number: '1.2-2' }}</dd>
      </div>
    </dl>

    <h3><span class="material-symbols-outlined" aria-hidden="true">sell</span> Tax Summary <span class="material-symbols-outlined info" title="No tax data is captured in this app, so tax stays 0.00.">info</span></h3>
    <dl>
      <div>
        <dt>Total Tax</dt>
        <dd>{{ totals().totalTax | number: '1.2-2' }}</dd>
      </div>
      <div>
        <dt>Suspended Tax</dt>
        <dd>{{ totals().suspendedTax | number: '1.2-2' }}</dd>
      </div>
    </dl>

    <div class="net">
      <h3><span class="material-symbols-outlined" aria-hidden="true">payments</span> Net Total</h3>
      <p data-testid="net-total">Rs. {{ totals().netTotal | number: '1.2-2' }}</p>
    </div>

    <ng-content />
  `,
  styles: `
    :host { display: block; }
    h2, h3 { display: flex; align-items: center; gap: 8px; margin: 0; }
    h2 { margin-bottom: 14px; font-size: 1rem; font-weight: 500; color: #2f5fc4; }
    h3 { margin-bottom: 10px; font-size: 0.875rem; font-weight: 600; }
    .material-symbols-outlined { font-size: 20px; }
    .material-symbols-outlined.info { font-size: 16px; color: #6b7280; cursor: help; vertical-align: middle; }
    dl { margin: 0 0 18px; display: grid; gap: 8px; }
    dl div { display: flex; justify-content: space-between; align-items: baseline; padding-left: 28px; }
    dt { font-size: 0.8125rem; color: #4b5260; }
    dd { margin: 0; font-size: 0.875rem; font-weight: 500; }
    .net { margin-bottom: 20px; }
    .net p { margin: 0; text-align: right; font-size: 1.25rem; font-weight: 600; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPanel {
  readonly totalItems = input.required<number>();
  readonly totalQuantity = input.required<number>();
  readonly totals = input.required<BillTotals>();
}
