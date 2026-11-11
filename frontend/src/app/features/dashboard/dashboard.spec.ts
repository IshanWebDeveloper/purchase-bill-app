import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { Dashboard } from './dashboard';

const api = `${environment.apiUrl}/api/dashboard`;

function setup() {
  TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { displayName: () => 'Tester' } },
    ],
  });
  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  const el = fixture.nativeElement as HTMLElement;
  const all = (selector: string) => Array.from(el.querySelectorAll<HTMLElement>(selector));
  const text = (node: Element | null | undefined) => node?.textContent?.replace(/\s+/g, ' ').trim();
  return { fixture, http, el, all, text };
}

describe('Dashboard', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('greets the user and asks each widget endpoint for its data', () => {
    const { http, el, text } = setup();

    expect(text(el.querySelector('h1'))).toBe('Welcome, Tester');
    expect(http.expectOne(`${api}/latest-bills?take=5`).request.method).toBe('GET');
    http.expectOne(`${api}/oldest-items?take=10`);
    http.expectOne(`${api}/item-quantities`);
  });

  it('renders the latest bills, the oldest items and the donut legend', () => {
    const { fixture, http, el, all, text } = setup();

    http.expectOne(`${api}/latest-bills?take=5`).flush([
      { id: 7, createdAtUtc: '2026-11-11T08:00:00Z', netAmount: 1234.5, itemCount: 3, totalQuantity: 9 },
      { id: 6, createdAtUtc: '2026-11-10T08:00:00Z', netAmount: 400, itemCount: 1, totalQuantity: 5 },
    ]);
    http.expectOne(`${api}/oldest-items?take=10`).flush([
      { billId: 1, itemName: 'Mango', qty: 5 },
      { billId: 1, itemName: 'Kiwi', qty: 2 },
    ]);
    http.expectOne(`${api}/item-quantities`).flush([
      { itemName: 'Mango', totalQuantity: 1200 },
      { itemName: 'Kiwi', totalQuantity: 300 },
    ]);
    fixture.detectChanges();

    const billRows = all('[data-testid="bill-row"]');
    const cells = (row: HTMLElement) => Array.from(row.querySelectorAll('td')).map((td) => text(td));
    expect(billRows.map(cells)).toEqual([
      ['#7', '1,234.50', '3'],
      ['#6', '400.00', '1'],
    ]);

    const itemRows = all('[data-testid="item-row"]');
    expect(itemRows).toHaveLength(2);
    expect(text(itemRows[0])).toContain('Mango');
    expect(text(itemRows[0])).toContain('Purchase bill #1');
    expect(text(itemRows[0])).toContain('Qty 5');

    expect(text(el.querySelector('[data-testid="donut-total"]'))).toBe('1,500');
    const legend = all('[data-testid="legend-row"]').map((r) => [text(r.querySelector('strong')), text(r.querySelector('.name'))]);
    expect(legend).toEqual([
      ['1,200', 'Mango'],
      ['300', 'Kiwi'],
    ]);
    const slices = el.querySelectorAll('svg circle:not(.track)');
    expect(slices).toHaveLength(2);
    expect(slices[0].getAttribute('stroke-dasharray')).toBe('80 20');
    expect(el.querySelector('svg')!.getAttribute('aria-label')).toContain('Mango 1200');
  });

  it('shows an empty state in every widget when there are no bills', () => {
    const { fixture, http, all } = setup();

    http.expectOne(`${api}/latest-bills?take=5`).flush([]);
    http.expectOne(`${api}/oldest-items?take=10`).flush([]);
    http.expectOne(`${api}/item-quantities`).flush([]);
    fixture.detectChanges();

    expect(all('[data-testid="empty"]')).toHaveLength(3);
    expect(all('table')).toHaveLength(0);
  });

  it('shows an error in only the failing widget, and Retry loads it again', () => {
    const { fixture, http, el, all, text } = setup();

    http.expectOne(`${api}/latest-bills?take=5`).flush(null, { status: 500, statusText: 'Server Error' });
    http.expectOne(`${api}/oldest-items?take=10`).flush([{ billId: 1, itemName: 'Mango', qty: 5 }]);
    http.expectOne(`${api}/item-quantities`).flush([{ itemName: 'Mango', totalQuantity: 5 }]);
    fixture.detectChanges();

    const alerts = all('[role="alert"]');
    expect(alerts).toHaveLength(1);
    expect(text(alerts[0])).toContain('Something went wrong');
    expect(all('[data-testid="item-row"]')).toHaveLength(1);

    const retry = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Retry')!;
    retry.click();
    http.expectOne(`${api}/latest-bills?take=5`).flush([
      { id: 1, createdAtUtc: '2026-11-11T08:00:00Z', netAmount: 400, itemCount: 1, totalQuantity: 5 },
    ]);
    fixture.detectChanges();

    expect(all('[role="alert"]')).toHaveLength(0);
    expect(all('[data-testid="bill-row"]')).toHaveLength(1);
  });
});
