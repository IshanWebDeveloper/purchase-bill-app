import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

/** The white card every dashboard widget sits in, with its loading, error and empty states. */
@Component({
  selector: 'app-widget-card',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink],
  template: `
    <header>
      <h2>{{ heading() }}</h2>
      <button
        type="button"
        mat-icon-button
        [attr.aria-label]="'Refresh ' + heading()"
        title="Refresh"
        [disabled]="loading()"
        (click)="refresh.emit()"
      >
        <mat-icon fontSet="material-symbols-outlined">refresh</mat-icon>
      </button>
    </header>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" [attr.aria-label]="'Loading ' + heading()" />
    }

    <div class="body" [attr.aria-busy]="loading()">
      @if (error()) {
        <div class="state error" role="alert">
          <span class="material-symbols-outlined" aria-hidden="true">error</span>
          <p>{{ error() }}</p>
          <button mat-button type="button" (click)="refresh.emit()">Retry</button>
        </div>
      } @else if (empty()) {
        <!-- While the first load is running there is nothing to show yet, not even "no bills". -->
        @if (!loading()) {
          <div class="state" data-testid="empty">
            <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
            <p>No purchase bills yet.</p>
            <a mat-button routerLink="/purchase-bill">Create a purchase bill</a>
          </div>
        }
      } @else {
        <ng-content />
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-width: 0;
      border: 1px solid #dfe3ea;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 6px 6px 18px;
      border-bottom: 1px solid #eef0f4;
    }
    h2 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      color: #4b5260;
    }
    button[mat-icon-button] {
      --mat-icon-button-icon-color: #1f6fd0;
    }
    .body {
      flex: 1;
      padding: 16px 18px 18px;
    }
    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 24px 8px;
      text-align: center;
      color: #6b7280;
    }
    .state p {
      margin: 0;
      font-size: 0.875rem;
    }
    .state .material-symbols-outlined {
      font-size: 32px;
    }
    .state.error {
      color: #b3261e;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCard {
  readonly heading = input.required<string>();
  readonly loading = input(false);
  readonly error = input('');
  /** Shows the "no purchase bills yet" state instead of the content. */
  readonly empty = input(false);
  readonly refresh = output();
}
