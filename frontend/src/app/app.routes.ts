import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'purchase-bill',
    canActivate: [authGuard],
    loadComponent: () => import('./features/purchase-bill/purchase-bill').then((m) => m.PurchaseBill),
  },
  { path: '', pathMatch: 'full', redirectTo: 'purchase-bill' },
  { path: '**', redirectTo: 'purchase-bill' },
];
