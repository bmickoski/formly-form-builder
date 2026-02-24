import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./builder/builder-page.component').then((m) => m.BuilderPageComponent),
  },
];
