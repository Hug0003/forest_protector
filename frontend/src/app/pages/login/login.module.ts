// src/app/pages/login/login.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login.page';

const routes: Routes = [
  {
    path: '',
    component: LoginPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    LoginPage  // Importer, ne pas déclarer (composant standalone)
  ]
})
export class LoginPageModule {}