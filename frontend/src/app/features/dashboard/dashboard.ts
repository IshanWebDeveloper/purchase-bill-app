import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ItemQuantities } from './item-quantities/item-quantities';
import { LatestBills } from './latest-bills/latest-bills';
import { OldestItems } from './oldest-items/oldest-items';

/** Welcome dashboard: three widgets over the signed-in user's purchase bills. */
@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule, MatIconModule, RouterLink, LatestBills, OldestItems, ItemQuantities],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
}
