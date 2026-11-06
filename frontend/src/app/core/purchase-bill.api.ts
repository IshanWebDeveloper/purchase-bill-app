import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Location } from './models/auth.models';
import { CreatePurchaseBillRequest, LineItem, PurchaseBillResponse } from './models/purchase-bill.models';

@Injectable({ providedIn: 'root' })
export class PurchaseBillApi {
  private readonly http = inject(HttpClient);

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${environment.apiUrl}/api/locations`);
  }

  /** Sends only the user's inputs: the API recalculates every total itself. */
  create(lines: readonly LineItem[]): Observable<PurchaseBillResponse> {
    const body: CreatePurchaseBillRequest = {
      items: lines.map((l) => ({
        item: l.item,
        batchCode: l.batchCode,
        standardCost: l.standardCost,
        standardPrice: l.standardPrice,
        qty: l.qty,
        freeQty: l.freeQty,
        discountPercent: l.discountPercent,
      })),
    };
    return this.http.post<PurchaseBillResponse>(`${environment.apiUrl}/api/purchase-bills`, body);
  }
}
