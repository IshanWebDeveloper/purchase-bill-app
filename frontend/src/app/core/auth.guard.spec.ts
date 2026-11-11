import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guard';

function run(guard: typeof authGuard, signedIn: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { isAuthenticated: () => signedIn } },
    ],
  });
  const result = TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  return { result, router: TestBed.inject(Router) };
}

describe('route guards', () => {
  it('authGuard lets a signed-in user through', () => {
    expect(run(authGuard, true).result).toBe(true);
  });

  it('authGuard redirects a signed-out user to /login', () => {
    const { result, router } = run(authGuard, false);
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('guestGuard lets a signed-out user see the login page', () => {
    expect(run(guestGuard, false).result).toBe(true);
  });

  it('guestGuard sends a signed-in user to the dashboard', () => {
    const { result, router } = run(guestGuard, true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
