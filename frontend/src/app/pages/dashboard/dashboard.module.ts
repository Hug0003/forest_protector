import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    DashboardPage  // Importer, ne pas déclarer (composant standalone)
  ]
})
export class DashboardPageModule { }
