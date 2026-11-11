import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { toUserMessage } from '../../core/error.interceptor';
import { Location } from '../../core/models/auth.models';
import { LineItem } from '../../core/models/purchase-bill.models';
import { PurchaseBillApi } from '../../core/purchase-bill.api';
import { billTotals } from './calculations';
import { ItemForm } from './item-form/item-form';
import { ItemTable } from './item-table/item-table';
import { SummaryPanel } from './summary-panel/summary-panel';

@Component({
  selector: 'app-purchase-bill',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
    ItemForm,
    ItemTable,
    SummaryPanel,
  ],
  templateUrl: './purchase-bill.html',
  styleUrl: './purchase-bill.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseBill {
  private readonly api = inject(PurchaseBillApi);

  protected readonly itemForm = viewChild(ItemForm);

  protected readonly locations = signal<Location[]>([]);
  protected readonly loadingLocations = signal(true);
  protected readonly locationsError = signal('');

  protected readonly rows = signal<LineItem[]>([]);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly savedMessage = signal('');

  // Summary values, always derived from the table rows.
  protected readonly totalItems = computed(() => this.rows().length);
  protected readonly totalQuantity = computed(() => this.rows().reduce((sum, r) => sum + r.qty, 0));
  protected readonly totals = computed(() => billTotals(this.rows()));

  constructor() {
    this.loadLocations();
  }

  protected loadLocations(): void {
    this.loadingLocations.set(true);
    this.locationsError.set('');
    this.api.getLocations().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.loadingLocations.set(false);
      },
      error: (err: unknown) => {
        this.locationsError.set(toUserMessage(err));
        this.loadingLocations.set(false);
      },
    });
  }

  protected addRow(line: LineItem): void {
    this.rows.update((rows) => [...rows, line]);
    this.saveError.set('');
    this.savedMessage.set('');
  }

  protected removeRow(index: number): void {
    this.rows.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected save(): void {
    if (this.saving() || this.rows().length === 0) return;

    this.saving.set(true);
    this.saveError.set('');
    this.savedMessage.set('');
    this.api.create(this.rows()).subscribe({
      next: (bill) => {
        this.rows.set([]);
        this.saving.set(false);
        this.savedMessage.set(`Purchase bill #${bill.id} saved.`);
      },
      error: (err: unknown) => {
        this.saveError.set(toUserMessage(err));
        this.saving.set(false);
      },
    });
  }
}
