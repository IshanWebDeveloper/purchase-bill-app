import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, Session } from './models/auth.models';

const STORAGE_KEY = 'pb.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.readSession());

  readonly displayName = computed(() => this.session()?.displayName ?? '');

  /** Bearer token, or null when signed out or expired. */
  get token(): string | null {
    const s = this.session();
    return s && !this.isExpired(s) ? s.token : null;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, request).pipe(
      tap((res) =>
        this.saveSession({
          token: res.token,
          expiresAtUtc: res.expiresAtUtc,
          displayName: res.displayName,
        }),
      ),
    );
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /** Drops the session without navigating (used by the 401 interceptor and tests). */
  clearSession(): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: in-memory state is already cleared
    }
  }

  private saveSession(session: Session): void {
    this.session.set(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // storage unavailable: the session still works until the tab reloads
    }
  }

  private readSession(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (!parsed.token || !parsed.expiresAtUtc) return null;
      const session: Session = {
        token: parsed.token,
        expiresAtUtc: parsed.expiresAtUtc,
        displayName: parsed.displayName ?? '',
      };
      return this.isExpired(session) ? null : session;
    } catch {
      return null;
    }
  }

  private isExpired(session: Session): boolean {
    return new Date(session.expiresAtUtc).getTime() <= Date.now();
  }
}
