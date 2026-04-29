import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonToggle, IonText,
  IonInput, IonGrid, IonRow, IonCol, IonButtons,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, settingsOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonToggle, IonText,
    IonInput, IonGrid, IonRow, IonCol, IonButtons
  ]
})
export class ProfilePage implements OnInit {
  user = {
    email: 'admin@forest-monitoring.fr',
    name: 'Administrateur',
    role: 'admin',
    organization: 'Forest Monitoring Service'
  };

  settings = {
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    autoRefresh: true
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ logOutOutline, settingsOutline });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Charger le profil utilisateur (à implémenter avec le backend)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.user = { ...this.user, ...JSON.parse(storedUser) };
      } catch (error) {
        console.error('Erreur parsing user:', error);
      }
    }

    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      } catch (error) {
        console.error('Erreur parsing settings:', error);
      }
    }
  }

  saveSettings() {
    localStorage.setItem('settings', JSON.stringify(this.settings));
    this.showMessage('Paramètres sauvegardés');
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Déconnexion',
          role: 'confirm',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  changePassword() {
    this.showMessage('Fonctionnalité en développement');
  }

  showMessage(msg: string) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2dd36f;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 9999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}
