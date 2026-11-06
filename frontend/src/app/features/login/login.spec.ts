import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Login } from './login';

function setup(login: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    imports: [Login],
    providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
  });
  const fixture = TestBed.createComponent(Login);
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const fill = (selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  return { fixture, el, fill, submit, navigate };
}

describe('Login', () => {
  it('does not call the API and shows errors when the form is empty', () => {
    const login = vi.fn();
    const { el, submit } = setup(login);

    submit();

    expect(login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Email is required.');
    expect(el.textContent).toContain('Password is required.');
  });

  it('rejects an invalid email', () => {
    const login = vi.fn();
    const { el, fill, submit } = setup(login);

    fill('input[type="email"]', 'not-an-email');
    fill('input[formControlName="password"]', 'pw');
    submit();

    expect(login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Enter a valid email address.');
  });

  it('logs in with trimmed email and navigates to the purchase bill page', () => {
    const login = vi.fn().mockReturnValue(of({}));
    const { fill, submit, navigate } = setup(login);

    fill('input[type="email"]', '  user@example.com ');
    fill('input[formControlName="password"]', 'pw');
    submit();

    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'pw' });
    expect(navigate).toHaveBeenCalledWith(['/purchase-bill']);
  });

  it('shows a clear message and stays on the page when credentials are wrong', () => {
    const login = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const { el, fill, submit, navigate } = setup(login);

    fill('input[type="email"]', 'user@example.com');
    fill('input[formControlName="password"]', 'bad');
    submit();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Invalid email or password.');
    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector<HTMLButtonElement>('.login-button')!.disabled).toBe(false);
  });

  it('shows a connectivity message when the server is unreachable', () => {
    const login = vi
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const { el, fill, submit } = setup(login);

    fill('input[type="email"]', 'user@example.com');
    fill('input[formControlName="password"]', 'pw');
    submit();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Cannot reach the server');
  });

  it('toggles password visibility', () => {
    const { fixture, el } = setup(vi.fn());
    const password = () => el.querySelector<HTMLInputElement>('input[formControlName="password"]')!;
    expect(password().type).toBe('password');

    el.querySelector<HTMLButtonElement>('button[matSuffix]')!.click();
    fixture.detectChanges();

    expect(password().type).toBe('text');
  });
});
