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


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonIcon, IonSpinner
  ]
})
export class HomePage implements OnInit {
  activeSensors = 0;
  alertsCount = 0;
  offlineSensors = 0;
  totalSensors = 0;
  isLoading = true;
  recentAlerts: any[] = [];

  constructor(private sensorService: SensorService) {
    addIcons({ mapOutline, barChartOutline, alertCircleOutline, settingsOutline });
  }

  ngOnInit() {
    // Initial load
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const allSensors = await this.sensorService.getSensors();
      const sensors = allSensors.filter(s => s.status !== 'maintenance' && s.status !== 'stolen');
      this.totalSensors = sensors.length;
      this.activeSensors = sensors.filter(s => s.status === 'active').length;
      this.alertsCount = sensors.filter(s => s.status === 'alert').length;
      this.offlineSensors = sensors.filter(s => s.status === 'offline').length;
      
      // Simulation ou récupération des alertes récentes
      this.recentAlerts = sensors
        .filter(s => s.status === 'alert')
        .slice(0, 3)
        .map(s => ({
          title: `Alerte ${s.uid}`,
          message: 'Détection anormale - vérifier zone',
          severity: 'critical',
          time: 'Récemment'
        }));
    } catch (error) {
      console.error('Erreur chargement capteurs:', error);
      this.totalSensors = 0;
      this.activeSensors = 0;
      this.alertsCount = 0;
      this.offlineSensors = 0;
      this.recentAlerts = [];
    }
    this.isLoading = false;
  }
}
