import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { HistoryPage } from './history.page';

const routes: Routes = [
  {
    path: '',
    component: HistoryPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    HistoryPage  // Importer, ne pas déclarer (composant standalone)
  ]
})
export class HistoryPageModule { }
