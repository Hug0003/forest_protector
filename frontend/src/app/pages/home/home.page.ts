import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardContent, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, barChartOutline, alertCircleOutline, settingsOutline } from 'ionicons/icons';
import { SensorService } from '../../services/sensor.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardContent, IonButton, IonIcon,
    IonGrid, IonRow, IonCol, IonText
  ]
})
export class HomePage implements OnInit {
  activeSensors = 0;
  alertsCount = 0;
  isLoading = true;

  constructor(private sensorService: SensorService) {
    addIcons({ mapOutline, barChartOutline, alertCircleOutline, settingsOutline });
  }

  async ngOnInit() {
    try {
      const sensors = await this.sensorService.getSensors();
      this.activeSensors = sensors.filter(s => s.status === 'active').length;
      this.alertsCount = sensors.filter(s => s.status === 'alert').length;
    } catch (error) {
      console.error('Erreur chargement capteurs:', error);
      // Mode démo
      this.activeSensors = 24;
      this.alertsCount = 2;
    }
    this.isLoading = false;
  }
}
