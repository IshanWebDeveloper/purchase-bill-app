import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DashboardApi } from '../../../core/dashboard.api';
import { BillSummary } from '../../../core/models/dashboard.models';
import { loadable } from '../loadable';
import { WidgetCard } from '../widget-card/widget-card';

/** Widget 1: the latest 5 purchase bills with ID, Net Amount and No. of Items. */
@Component({
  selector: 'app-latest-bills',
  imports: [DecimalPipe, WidgetCard],
  template: `
    <app-widget-card
      heading="Latest Purchase Bills"
      [loading]="bills.loading()"
      [error]="bills.error()"
      [empty]="bills.value().length === 0"
      (refresh)="bills.reload()"
    >
      <p class="caption">{{ bills.value().length }} most recent purchase bills</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Bill ID</th>
            <th scope="col" class="num">Net Amount (Rs.)</th>
            <th scope="col" class="num">No. of Items</th>
          </tr>
        </thead>
        <tbody>
          @for (bill of bills.value(); track bill.id) {
            <tr data-testid="bill-row">
              <td>#{{ bill.id }}</td>
              <td class="num">{{ bill.netAmount | number: '1.2-2' }}</td>
              <td class="num">{{ bill.itemCount }}</td>
            </tr>
          }
        </tbody>
      </table>
    </app-widget-card>
  `,
  styles: `
    :host {
      display: contents;
    }
    .caption {
      margin: 0 0 14px;
      font-size: 0.875rem;
      color: #2b2f36;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    th {
      padding: 10px 8px;
      border-bottom: 1px solid #e3e6ec;
      font-weight: 500;
      text-align: left;
      color: #1f6fd0;
    }
    td {
      padding: 11px 8px;
      border-bottom: 1px solid #eef0f4;
      color: #374151;
    }
    tbody tr:nth-child(odd) {
      background: #f8f9fb;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestBills {
  private readonly api = inject(DashboardApi);
  protected readonly bills = loadable(() => this.api.latestBills(5), [] as BillSummary[]);
}
