import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { LineItem } from '../../core/models/purchase-bill.models';
import { PurchaseBillApi } from '../../core/purchase-bill.api';
import { buildLineItem } from './calculations';
import { PurchaseBill } from './purchase-bill';

const line = (item: string, qty: number): LineItem =>
  buildLineItem({
    item,
    batchCode: 'L1',
    batchName: 'Block C',
    standardCost: 100,
    standardPrice: 150,
    qty,
    freeQty: 0,
    discountPercent: 20,
  });

function setup(api: Partial<PurchaseBillApi> = {}) {
  const fullApi = {
    getLocations: vi.fn().mockReturnValue(of([{ locationCode: 'L1', locationName: 'Block C' }])),
    create: vi.fn(),
    ...api,
  };
  TestBed.configureTestingModule({
    imports: [PurchaseBill],
    providers: [
      provideRouter([]),
      { provide: PurchaseBillApi, useValue: fullApi },
      { provide: AuthService, useValue: { displayName: () => 'Tester', logout: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(PurchaseBill);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const page = fixture.componentInstance as unknown as {
    addRow(l: LineItem): void;
    removeRow(i: number): void;
  };
  const text = (testId: string) => el.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  const saveButton = () => el.querySelector<HTMLButtonElement>('button.save')!;
  return { fixture, el, page, text, saveButton, api: fullApi };
}

describe('PurchaseBill page', () => {
  it('loads the batches on start', () => {
    const { api } = setup();
    expect(api.getLocations).toHaveBeenCalledTimes(1);
  });

  it('shows a retry banner when batches cannot be loaded', () => {
    const { el } = setup({
      getLocations: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 }))),
    });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Could not load batches');
    expect(el.textContent).toContain('Retry');
  });

  it('starts empty: no rows, totals 0, Save disabled', () => {
    const { text, saveButton, el } = setup();
    expect(text('total-items')).toBe('0');
    expect(text('total-quantity')).toBe('0');
    expect(saveButton().disabled).toBe(true);
    expect(el.textContent).toContain('No items added yet');
  });

  it('Total Items is the row count and Total Quantity is the sum of Qty', () => {
    const { page, fixture, text } = setup();

    page.addRow(line('Mango', 5));
    page.addRow(line('Apple', 3));
    fixture.detectChanges();

    expect(text('total-items')).toBe('2');
    expect(text('total-quantity')).toBe('8');
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')).toHaveLength(2);
  });

  it('updates the summary when a row is removed', () => {
    const { page, fixture, text } = setup();
    page.addRow(line('Mango', 5));
    page.addRow(line('Apple', 3));

    page.removeRow(0);
    fixture.detectChanges();

    expect(text('total-items')).toBe('1');
    expect(text('total-quantity')).toBe('3');
  });

  it('saves the rows, then clears the table', () => {
    const create = vi.fn().mockReturnValue(of({ id: 7, createdAtUtc: '', totalItems: 2, totalQuantity: 8 }));
    const { page, fixture, saveButton, text } = setup({ create });
    page.addRow(line('Mango', 5));
    page.addRow(line('Apple', 3));
    fixture.detectChanges();

    saveButton().click();
    fixture.detectChanges();

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toHaveLength(2);
    expect(text('total-items')).toBe('0');
    expect(fixture.nativeElement.querySelector('.success')?.textContent).toContain('Purchase bill #7 saved.');

    // The confirmation goes away once the user starts the next bill.
    page.addRow(line('Kiwi', 1));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.success')).toBeNull();
  });

  it('keeps the rows and shows an error when saving fails', () => {
    const create = vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { page, fixture, saveButton, text, el } = setup({ create });
    page.addRow(line('Mango', 5));
    fixture.detectChanges();

    saveButton().click();
    fixture.detectChanges();

    expect(text('total-items')).toBe('1');
    expect(el.querySelector('.error')?.textContent).toContain('Something went wrong');
    expect(saveButton().disabled).toBe(false);
  });
});
