import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BillItemSummary, BillSummary, ItemQuantity } from './models/dashboard.models';

/** The dashboard widgets' data. The API only ever returns the signed-in user's bills. */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/dashboard`;

  latestBills(take = 5): Observable<BillSummary[]> {
    return this.http.get<BillSummary[]>(`${this.base}/latest-bills`, { params: { take } });
  }

  oldestItems(take = 10): Observable<BillItemSummary[]> {
    return this.http.get<BillItemSummary[]>(`${this.base}/oldest-items`, { params: { take } });
  }

  itemQuantities(): Observable<ItemQuantity[]> {
    return this.http.get<ItemQuantity[]>(`${this.base}/item-quantities`);
  }
}
