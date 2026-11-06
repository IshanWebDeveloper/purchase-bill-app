import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Item Summary: Total Items = number of table rows, Total Quantity = sum of Qty. */
@Component({
  selector: 'app-summary-panel',
  template: `
    <h2>Item Summary</h2>
    <dl>
      <div>
        <dt>Total Items</dt>
        <dd data-testid="total-items">{{ totalItems() }}</dd>
      </div>
      <div>
        <dt>Total Quantity</dt>
        <dd data-testid="total-quantity">{{ totalQuantity() }}</dd>
      </div>
    </dl>
    <ng-content />
  `,
  styles: `
    :host { display: block; }
    h2 { margin: 0 0 16px; font-size: 1.125rem; font-weight: 500; }
    dl { margin: 0 0 16px; display: grid; gap: 12px; }
    dl div { display: flex; justify-content: space-between; align-items: baseline; }
    dt { color: #6b7280; }
    dd { margin: 0; font-size: 1.5rem; font-weight: 500; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPanel {
  readonly totalItems = input.required<number>();
  readonly totalQuantity = input.required<number>();
}
