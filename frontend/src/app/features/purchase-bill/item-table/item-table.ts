import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { LineItem } from '../../../core/models/purchase-bill.models';

@Component({
  selector: 'app-item-table',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './item-table.html',
  styleUrl: './item-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemTable {
  readonly rows = input.required<LineItem[]>();
  readonly disabled = input(false);
  readonly removed = output<number>();

  protected readonly columns = [
    'item',
    'batch',
    'standardCost',
    'standardPrice',
    'margin',
    'qty',
    'freeQty',
    'discountPercent',
    'totalCost',
    'totalSelling',
    'actions',
  ];
}
