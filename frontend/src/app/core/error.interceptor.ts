import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * A 401 on any call other than login means the session is no longer valid:
 * clear it and send the user back to the login page.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.endsWith('/api/auth/login')) {
        auth.clearSession();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};

/** Turns any HTTP failure into a message that is safe and useful to show the user. */
export function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 400) return 'Please check the details you entered.';
    if (error.status === 502) return 'The service is not responding. Please try again in a moment.';
  }
  return 'Something went wrong. Please try again.';
}
