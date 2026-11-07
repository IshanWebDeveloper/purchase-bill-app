import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Summary sidebar: Total Items = number of table rows, Total Qty = sum of Qty. */
@Component({
  selector: 'app-summary-panel',
  template: `
    <h2><span class="material-symbols-outlined" aria-hidden="true">monitoring</span> Summary</h2>
    <h3><span class="material-symbols-outlined" aria-hidden="true">deployed_code</span> Item Summary</h3>
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
    <ng-content />
  `,
  styles: `
    :host { display: block; }
    h2, h3 { display: flex; align-items: center; gap: 8px; margin: 0; }
    h2 { margin-bottom: 14px; font-size: 1rem; font-weight: 500; color: #2f5fc4; }
    h3 { margin-bottom: 10px; font-size: 0.875rem; font-weight: 600; }
    .material-symbols-outlined { font-size: 20px; }
    dl { margin: 0 0 20px; display: grid; gap: 8px; }
    dl div { display: flex; justify-content: space-between; align-items: baseline; padding-left: 28px; }
    dt { font-size: 0.8125rem; color: #4b5260; }
    dd { margin: 0; font-size: 0.875rem; font-weight: 500; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPanel {
  readonly totalItems = input.required<number>();
  readonly totalQuantity = input.required<number>();
}
