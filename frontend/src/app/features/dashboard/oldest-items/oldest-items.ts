import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DashboardApi } from '../../../core/dashboard.api';
import { BillItemSummary } from '../../../core/models/dashboard.models';
import { loadable } from '../loadable';
import { WidgetCard } from '../widget-card/widget-card';

/** Widget 2: the oldest 10 purchase bill lines with Purchase Bill ID, Item Name and Qty. */
@Component({
  selector: 'app-oldest-items',
  imports: [WidgetCard],
  template: `
    <app-widget-card
      heading="Oldest Purchase Bill Items"
      [loading]="items.loading()"
      [error]="items.error()"
      [empty]="items.value().length === 0"
      (refresh)="items.reload()"
    >
      <ul>
        @for (line of items.value(); track $index) {
          <li data-testid="item-row">
            <span class="material-symbols-outlined icon" aria-hidden="true">nutrition</span>
            <div class="text">
              <span class="name">{{ line.itemName }}</span>
              <span class="bill">Purchase bill #{{ line.billId }}</span>
            </div>
            <span class="qty"><span class="label">Qty</span> {{ line.qty }}</span>
          </li>
        }
      </ul>
    </app-widget-card>
  `,
  styles: `
    :host {
      display: contents;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 4px;
      border-bottom: 1px solid #eef0f4;
    }
    li:last-child {
      border-bottom: 0;
    }
    .icon {
      font-size: 26px;
      color: #4b5260;
    }
    .text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #2b2f36;
    }
    .bill {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .qty {
      font-size: 0.875rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .label {
      font-weight: 400;
      color: #6b7280;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OldestItems {
  private readonly api = inject(DashboardApi);
  protected readonly items = loadable(() => this.api.oldestItems(10), [] as BillItemSummary[]);
}
