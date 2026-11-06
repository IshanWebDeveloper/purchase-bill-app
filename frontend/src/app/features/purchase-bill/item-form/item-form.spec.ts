import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '../../../core/models/auth.models';
import { LineItem } from '../../../core/models/purchase-bill.models';
import { ItemForm } from './item-form';

const LOCATIONS: Location[] = [
  { locationCode: 'L1', locationName: 'Block C' },
  { locationCode: 'L2', locationName: 'Van 1' },
  { locationCode: 'L3', locationName: 'Van 1' },
];

function setup() {
  TestBed.configureTestingModule({ imports: [ItemForm] });
  const fixture: ComponentFixture<ItemForm> = TestBed.createComponent(ItemForm);
  fixture.componentRef.setInput('locations', LOCATIONS);
  const added: LineItem[] = [];
  fixture.componentInstance.added.subscribe((l) => added.push(l));
  fixture.detectChanges();

  const el = fixture.nativeElement as HTMLElement;
  const input = (name: string) => el.querySelector<HTMLInputElement>(`input[formControlName="${name}"]`)!;
  const type = (name: string, value: string) => {
    const i = input(name);
    i.value = value;
    i.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  // The Batch is a mat-select; set the control directly instead of driving the overlay.
  const form = (fixture.componentInstance as unknown as { form: { controls: Record<string, { setValue(v: unknown): void }> } }).form;
  const chooseBatch = (code: string) => {
    form.controls['batchCode'].setValue(code);
    fixture.detectChanges();
  };
  const addButton = () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const calculated = () =>
    Array.from(el.querySelectorAll<HTMLInputElement>('.calculated input')).map((i) => i.value);
  const fillValid = () => {
    type('item', 'Mango');
    chooseBatch('L1');
    type('standardCost', '100');
    type('standardPrice', '150');
    type('qty', '5');
    type('discountPercent', '20');
  };
  return { fixture, el, added, type, chooseBatch, addButton, calculated, fillValid, input };
}

describe('ItemForm', () => {
  it('disables Add until the form is valid', () => {
    const { addButton, fillValid, fixture } = setup();
    expect(addButton().disabled).toBe(true);

    fillValid();
    fixture.detectChanges();

    expect(addButton().disabled).toBe(false);
  });

  it('shows Margin, Total Cost and Total Selling as the user types (assignment example)', () => {
    const { calculated, fillValid } = setup();
    fillValid();
    expect(calculated()).toEqual(['50.00', '400.00', '750.00']);
  });

  it('emits the new line with calculated values and resets the form', async () => {
    const { added, fillValid, addButton, input, calculated, fixture } = setup();
    fillValid();

    addButton().click();
    fixture.detectChanges();
    await fixture.whenStable(); // the autocomplete input writes its reset value a microtask later
    fixture.detectChanges();

    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      item: 'Mango',
      batchCode: 'L1',
      batchName: 'Block C',
      qty: 5,
      freeQty: 0,
      discountPercent: 20,
      margin: 50,
      totalCost: 400,
      totalSelling: 750,
    });
    expect(input('item').value).toBe('');
    expect(input('qty').value).toBe('');
    expect(calculated()).toEqual(['0.00', '0.00', '0.00']);
    expect(fixture.nativeElement.textContent).not.toContain('is required');
  });

  it('stores the canonical item spelling when typed in a different case', () => {
    const { added, type, chooseBatch, addButton, fixture } = setup();
    type('item', 'kiwi');
    chooseBatch('L1');
    type('standardCost', '1');
    type('standardPrice', '2');
    type('qty', '1');

    addButton().click();
    fixture.detectChanges();

    expect(added[0].item).toBe('Kiwi');
  });

  it('rejects an item that is not in the list', () => {
    const { type, addButton, el, fixture } = setup();
    type('item', 'Pizza');
    (el.querySelector('input[formControlName="item"]') as HTMLInputElement).dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(addButton().disabled).toBe(true);
    expect(el.textContent).toContain('Choose an item from the list.');
  });

  it.each([
    ['qty', '0'],
    ['qty', '2.5'],
    ['freeQty', '-1'],
    ['discountPercent', '101'],
    ['discountPercent', '-5'],
    ['standardCost', '-1'],
    ['standardPrice', '-1'],
  ])('is invalid when %s is %s', (field, value) => {
    const { fillValid, type, addButton, fixture } = setup();
    fillValid();
    type(field, value);
    fixture.detectChanges();
    expect(addButton().disabled).toBe(true);
  });

  it('suggests only items that match what was typed', () => {
    const { type, fixture } = setup();
    type('item', 'an');
    const suggestions = (fixture.componentInstance as unknown as { filteredItems(): string[] }).filteredItems();
    expect(suggestions).toEqual(['Mango', 'Banana', 'Orange']);
  });

  it('adds the code to batch names that repeat', () => {
    const { fixture } = setup();
    const options = (fixture.componentInstance as unknown as { batchOptions(): { label: string }[] }).batchOptions();
    expect(options.map((o) => o.label)).toEqual(['Block C', 'Van 1 (L2)', 'Van 1 (L3)']);
  });
});
