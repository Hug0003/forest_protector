import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonChip, IonIcon,
  IonCard, IonCardContent, IonText, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, refreshOutline, arrowBack } from 'ionicons/icons';
import { SensorService } from '../../services/sensor.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonChip, IonIcon,
    IonCard, IonCardContent, IonText, IonGrid, IonRow, IonCol
  ]
})
export class DashboardPage implements OnInit {
  isLoading = true;
  
  stats = {
    totalSensors: 0,
    activeSensors: 0,
    offlineSensors: 0,
    alertCount: 0,
    avgTemperature: 0,
    avgHumidity: 0
  };



  constructor(private sensorService: SensorService) {
    addIcons({ mapOutline, refreshOutline, arrowBack });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const allSensors = await this.sensorService.getSensors();
      const sensors = allSensors.filter(s => s.status !== 'maintenance' && s.status !== 'stolen');
      
      this.stats.totalSensors = sensors.length;
      this.stats.activeSensors = sensors.filter(s => s.status === 'active').length;
      this.stats.offlineSensors = sensors.filter(s => s.status === 'offline').length;
      this.stats.alertCount = sensors.filter(s => s.status === 'alert').length;
      
      // Mode démo
      this.stats.avgTemperature = 23.5;
      this.stats.avgHumidity = 65;
    } catch (error) {
      console.error('Erreur chargement données:', error);
      // Valeurs par défaut : 0 si l'API échoue
      this.stats = {
        totalSensors: 0,
        activeSensors: 0,
        offlineSensors: 0,
        alertCount: 0,
        avgTemperature: 0,
        avgHumidity: 0
      };
    }
    this.isLoading = false;
  }

  refresh() {
    this.loadData();
  }


}
