import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DashboardApi } from '../../../core/dashboard.api';
import { ItemQuantity } from '../../../core/models/dashboard.models';
import { loadable } from '../loadable';
import { WidgetCard } from '../widget-card/widget-card';
import { DONUT_RADIUS, donutSegments, itemColour } from './donut';

/** Widget 3: a donut of total Qty per item name, across all of the user's bills. */
@Component({
  selector: 'app-item-quantities',
  imports: [DecimalPipe, WidgetCard],
  template: `
    <app-widget-card
      heading="Quantity by Item"
      [loading]="totals.loading()"
      [error]="totals.error()"
      [empty]="totals.value().length === 0"
      (refresh)="totals.reload()"
    >
      <div class="chart">
        <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="summary()">
          <circle class="track" cx="21" cy="21" [attr.r]="radius" />
          @for (slice of slices(); track slice.itemName) {
            <circle
              cx="21"
              cy="21"
              [attr.r]="radius"
              [attr.stroke]="slice.colour"
              [attr.stroke-dasharray]="slice.length + ' ' + (100 - slice.length)"
              [attr.stroke-dashoffset]="slice.offset"
            >
              <title>{{ slice.itemName }}: {{ slice.totalQuantity }} ({{ slice.length | number: '1.0-1' }}%)</title>
            </circle>
          }
        </svg>

        <div class="details">
          <p class="total" data-testid="donut-total">{{ grandTotal() | number }}</p>
          <p class="total-label">Total quantity</p>
          <ul>
            @for (slice of slices(); track slice.itemName) {
              <li data-testid="legend-row">
                <span class="dot" [style.background]="slice.colour" aria-hidden="true"></span>
                <span>
                  <strong>{{ slice.totalQuantity | number }}</strong>
                  <span class="name">{{ slice.itemName }}</span>
                </span>
              </li>
            }
          </ul>
        </div>
      </div>
    </app-widget-card>
  `,
  styles: `
    :host {
      display: contents;
    }
    .chart {
      display: grid;
      grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    svg {
      width: 100%;
      height: auto;
    }
    circle {
      fill: none;
      stroke-width: 7;
    }
    .track {
      stroke: #eef0f4;
    }
    .total {
      margin: 0;
      text-align: right;
      font-size: 1.375rem;
      font-weight: 600;
      color: #2b2f36;
    }
    .total-label {
      margin: 0 0 14px;
      text-align: right;
      font-size: 0.8125rem;
      color: #6b7280;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 10px;
    }
    li {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 0.8125rem;
    }
    li strong {
      display: block;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .name {
      color: #4b5260;
    }
    .dot {
      flex: none;
      width: 10px;
      height: 10px;
      margin-top: 4px;
      border-radius: 50%;
    }
    @media (max-width: 380px) {
      .chart {
        grid-template-columns: minmax(0, 1fr);
      }
      svg {
        max-width: 200px;
        margin: 0 auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemQuantities {
  private readonly api = inject(DashboardApi);
  protected readonly totals = loadable(() => this.api.itemQuantities(), [] as ItemQuantity[]);
  protected readonly radius = DONUT_RADIUS;

  protected readonly grandTotal = computed(() => this.totals.value().reduce((sum, t) => sum + t.totalQuantity, 0));

  protected readonly slices = computed(() => {
    const totals = this.totals.value();
    const segments = donutSegments(totals.map((t) => t.totalQuantity));
    return totals.map((t, i) => ({ ...t, ...segments[i], colour: itemColour(t.itemName) }));
  });

  /** What a screen reader hears instead of the picture. */
  protected readonly summary = computed(
    () =>
      `Quantity by item, ${this.grandTotal()} in total: ` +
      this.totals
        .value()
        .map((t) => `${t.itemName} ${t.totalQuantity}`)
        .join(', '),
  );
}
