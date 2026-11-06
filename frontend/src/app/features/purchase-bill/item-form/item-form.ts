import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Location } from '../../../core/models/auth.models';
import { LineItem } from '../../../core/models/purchase-bill.models';
import { buildLineItem, ITEMS, margin, totalCost, totalSelling } from '../calculations';

/** The typed text must be one of the allowed items (case-insensitive). */
const inList: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim().toLowerCase();
  if (!value) return null; // `required` reports the empty case
  return ITEMS.some((i) => i.toLowerCase() === value) ? null : { notInList: true };
};

const integer: ValidatorFn = (control) => {
  const v = control.value;
  return v === null || v === '' || Number.isInteger(v) ? null : { integer: true };
};

@Component({
  selector: 'app-item-form',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './item-form.html',
  styleUrl: './item-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemForm {
  readonly locations = input.required<Location[]>();
  readonly added = output<LineItem>();

  private readonly formDirective = viewChild(FormGroupDirective);

  protected readonly form = new FormGroup({
    item: new FormControl('', { nonNullable: true, validators: [Validators.required, inList] }),
    batchCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    standardCost: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    standardPrice: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    qty: new FormControl<number | null>(null, [Validators.required, Validators.min(1), integer]),
    freeQty: new FormControl<number | null>(0, [Validators.required, Validators.min(0), integer]),
    discountPercent: new FormControl<number | null>(0, [Validators.required, Validators.min(0), Validators.max(100)]),
  });

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Autocomplete suggestions for whatever has been typed so far. */
  protected readonly filteredItems = computed(() => {
    const typed = (this.values().item ?? '').trim().toLowerCase();
    return ITEMS.filter((i) => i.toLowerCase().includes(typed));
  });

  /** Batch options. Location names repeat ("Van 1" twice), so repeats get their code appended. */
  protected readonly batchOptions = computed(() => {
    const locations = this.locations();
    const counts = new Map<string, number>();
    for (const l of locations) counts.set(l.locationName, (counts.get(l.locationName) ?? 0) + 1);
    return locations.map((l) => ({
      code: l.locationCode,
      label: (counts.get(l.locationName) ?? 0) > 1 ? `${l.locationName} (${l.locationCode})` : l.locationName,
    }));
  });

  // Read-only calculated fields, updated as the user types.
  protected readonly margin = computed(() => {
    const v = this.values();
    return margin(v.standardPrice ?? 0, v.standardCost ?? 0);
  });
  protected readonly totalCost = computed(() => {
    const v = this.values();
    return totalCost(v.standardCost ?? 0, v.qty ?? 0, v.discountPercent ?? 0);
  });
  protected readonly totalSelling = computed(() => {
    const v = this.values();
    return totalSelling(v.standardPrice ?? 0, v.qty ?? 0);
  });

  protected add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const location = this.locations().find((l) => l.locationCode === v.batchCode);
    if (!location) return;

    this.added.emit(
      buildLineItem({
        // Use the canonical spelling from the list, whatever case was typed.
        item: ITEMS.find((i) => i.toLowerCase() === v.item.trim().toLowerCase()) ?? v.item,
        batchCode: location.locationCode,
        batchName: location.locationName,
        standardCost: v.standardCost ?? 0,
        standardPrice: v.standardPrice ?? 0,
        qty: v.qty ?? 0,
        freeQty: v.freeQty ?? 0,
        discountPercent: v.discountPercent ?? 0,
      }),
    );
    // resetForm also clears the touched/submitted state so no errors flash after adding.
    this.formDirective()?.resetForm({ freeQty: 0, discountPercent: 0 });
  }
}
