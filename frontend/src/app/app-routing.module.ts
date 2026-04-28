// src/app/app-routing.module.ts
const routes: Routes = [
  {
    path: '',
    redirectTo: 'map',  // Direct vers map
    pathMatch: 'full'
  },
  {
    path: 'map',
    loadChildren: () => import('./pages/map/map.module').then(m => m.MapPageModule)
    // ⚠️ SANS canActivate pour tester
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
    // ⚠️ SANS canActivate pour tester
  }
];