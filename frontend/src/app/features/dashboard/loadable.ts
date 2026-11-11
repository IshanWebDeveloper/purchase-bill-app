import { DestroyRef, inject, Signal, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { toUserMessage } from '../../core/error.interceptor';

export interface Loadable<T> {
  readonly value: Signal<T>;
  readonly loading: Signal<boolean>;
  /** User-facing message, or '' when the last load succeeded. */
  readonly error: Signal<string>;
  reload(): void;
}

/**
 * Loads `source()` straight away and on every `reload()`, exposing the result as signals.
 * A reload cancels a request still in flight. Must be called in an injection context.
 */
export function loadable<T>(source: () => Observable<T>, initial: T): Loadable<T> {
  const value = signal(initial);
  const loading = signal(false);
  const error = signal('');
  let current: Subscription | undefined;

  const reload = () => {
    current?.unsubscribe();
    loading.set(true);
    error.set('');
    current = source().subscribe({
      next: (v) => {
        value.set(v);
        loading.set(false);
      },
      error: (err: unknown) => {
        error.set(toUserMessage(err));
        loading.set(false);
      },
    });
  };

  inject(DestroyRef).onDestroy(() => current?.unsubscribe());
  reload();

  return { value: value.asReadonly(), loading: loading.asReadonly(), error: error.asReadonly(), reload };
}
