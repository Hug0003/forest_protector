// src/app/pages/login/login.page.ts
import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  LoadingController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ]
})
export class LoginPage {
  email: string = '';
  password: string = '';
  returnUrl: string = '/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    // Récupérer l'URL de retour si elle existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    console.log('🔙 URL de retour:', this.returnUrl);
  }

  async login() {
    console.log('🔑 Tentative de connexion:', this.email);
    
    const loading = await this.loadingCtrl.create({
      message: 'Connexion en cours...',
    });
    await loading.present();

    this.authService.login(this.email, this.password).subscribe({
      next: async (response) => {
        await loading.dismiss();
        console.log('✅ Connexion réussie, redirection vers:', this.returnUrl);
        
        const toast = await this.toastCtrl.create({
          message: `Bienvenue ${response.user.first_name} !`,
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        
        // Redirection vers la page demandée
        this.router.navigateByUrl(this.returnUrl);
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('❌ Erreur de connexion:', error);
        
        const toast = await this.toastCtrl.create({
          message: 'Email ou mot de passe incorrect',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  // Pour tester sans backend
  async loginDemo() {
    console.log('🎭 Mode démo - connexion automatique');
    
    // Simuler un token et un utilisateur
    localStorage.setItem('access_token', 'demo-token-123');
    localStorage.setItem('currentUser', JSON.stringify({
      id: 1,
      email: 'demo@forest.com',
      role: 'garde_forestier',
      first_name: 'Jean',
      last_name: 'Dupont'
    }));
    
    const toast = await this.toastCtrl.create({
      message: 'Mode démo activé',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
    
    this.router.navigateByUrl(this.returnUrl);
  }
}