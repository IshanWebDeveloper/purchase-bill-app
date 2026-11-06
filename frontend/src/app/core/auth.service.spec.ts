import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { LoginResponse } from './models/auth.models';

const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 60 * 1000).toISOString();

function response(expiresAtUtc = future()): LoginResponse {
  return { token: 'jwt-token', expiresAtUtc, displayName: 'Test User', locations: [] };
}

function setup() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
}

describe('AuthService', () => {
  beforeEach(() => sessionStorage.clear());

  it('starts signed out', () => {
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token).toBeNull();
  });

  it('posts credentials to the API and stores the session on success', () => {
    const { auth, http } = setup();
    let result: LoginResponse | undefined;

    auth.login({ email: 'a@b.com', password: 'secret' }).subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret' });
    req.flush(response());

    expect(result?.displayName).toBe('Test User');
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.token).toBe('jwt-token');
    expect(auth.displayName()).toBe('Test User');
    expect(sessionStorage.getItem('pb.session')).toContain('jwt-token');
    // The password must never be persisted.
    expect(sessionStorage.getItem('pb.session')).not.toContain('secret');
  });

  it('stays signed out when login fails', () => {
    const { auth, http } = setup();
    let failed = false;

    auth.login({ email: 'a@b.com', password: 'bad' }).subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/api/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('pb.session')).toBeNull();
  });

  it('restores a valid session from sessionStorage', () => {
    sessionStorage.setItem(
      'pb.session',
      JSON.stringify({ token: 't', expiresAtUtc: future(), displayName: 'Saved' }),
    );
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.displayName()).toBe('Saved');
  });

  it('ignores an expired stored session', () => {
    sessionStorage.setItem(
      'pb.session',
      JSON.stringify({ token: 't', expiresAtUtc: past(), displayName: 'Old' }),
    );
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('ignores corrupted stored data', () => {
    sessionStorage.setItem('pb.session', '{not json');
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('clearSession removes the token', () => {
    const { auth, http } = setup();
    auth.login({ email: 'a@b.com', password: 'x' }).subscribe();
    http.expectOne(`${environment.apiUrl}/api/auth/login`).flush(response());

    auth.clearSession();

    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('pb.session')).toBeNull();
  });
});
