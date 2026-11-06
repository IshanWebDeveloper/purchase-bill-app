import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';

// Placeholder shell so the route guard can be exercised; the form, table and summary come in the next step.
@Component({
  selector: 'app-purchase-bill',
  imports: [MatButtonModule],
  template: `
    <main class="page">
      <header>
        <h1>Purchase Bill</h1>
        <span>{{ auth.displayName() }}</span>
        <button mat-stroked-button type="button" (click)="auth.logout()">Log out</button>
      </header>
    </main>
  `,
  styles: `
    .page { padding: 24px 16px; }
    header { display: flex; align-items: center; gap: 16px; }
    h1 { flex: 1; margin: 0; font-size: 1.5rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseBill {
  protected readonly auth = inject(AuthService);
}
