import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, barChartOutline, alertCircleOutline, settingsOutline } from 'ionicons/icons';
import { SensorService } from '../../services/sensor.service';

interface Alert {
  id: number;
  title: string;
  message: string;
  severity: 'critical' | 'warning';
  time: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonIcon, IonSpinner
  ]
})
export class HomePage implements OnInit {
  activeSensors = 0;
  alertsCount = 0;
  offlineSensors = 0;
  totalSensors = 0;
  isLoading = true;
  recentAlerts: Alert[] = [];

  constructor(private sensorService: SensorService) {
    addIcons({ mapOutline, barChartOutline, alertCircleOutline, settingsOutline });
  }

  async ngOnInit() {
    try {
      const sensors = await this.sensorService.getSensors();
      this.totalSensors = sensors.length;
      this.activeSensors = sensors.filter(s => s.status === 'active').length;
      this.alertsCount = sensors.filter(s => s.status === 'alert').length;
      this.offlineSensors = sensors.filter(s => s.status === 'offline').length;

      // Demo alerts
      this.recentAlerts = [
        {
          id: 1,
          title: 'Capteur Zone B hors ligne',
          message: 'Le capteur B-001 n\'a pas communiqué depuis 2 heures',
          severity: 'critical',
          time: 'Il y a 15 min'
        },
        {
          id: 2,
          title: 'Température anormale détectée',
          message: 'Pic de température détecté en Zone A',
          severity: 'warning',
          time: 'Il y a 45 min'
        }
      ];
    } catch (error) {
      console.error('Erreur chargement capteurs:', error);
      // Mode démo
      this.totalSensors = 28;
      this.activeSensors = 24;
      this.alertsCount = 2;
      this.offlineSensors = 2;

      this.recentAlerts = [
        {
          id: 1,
          title: 'Capteur Zone B hors ligne',
          message: 'Le capteur B-001 n\'a pas communiqué depuis 2 heures',
          severity: 'critical',
          time: 'Il y a 15 min'
        },
        {
          id: 2,
          title: 'Température anormale détectée',
          message: 'Pic de température détecté en Zone A',
          severity: 'warning',
          time: 'Il y a 45 min'
        }
      ];
    }
    this.isLoading = false;
  }
}
