import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Shell } from './shell';

describe('Shell', () => {
  function setup() {
    const auth = { displayName: () => 'Tester', logout: vi.fn() };
    TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, auth };
  }

  it('shows the signed-in user and links to every section', () => {
    const { el } = setup();

    expect(el.querySelector('[data-testid="user-name"]')?.textContent).toContain('Tester');
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/dashboard', '/purchase-bill']);
  });

  it('logs out from the top bar', () => {
    const { el, auth } = setup();

    el.querySelector<HTMLButtonElement>('button[aria-label="Log out"]')!.click();

    expect(auth.logout).toHaveBeenCalled();
  });
});
