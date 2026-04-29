import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonChip, IonIcon, IonSegment, IonSegmentButton,
  IonCard, IonCardContent, IonText, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, refreshOutline } from 'ionicons/icons';
import { SensorService } from '../../services/sensor.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonChip, IonIcon, IonSegment, IonSegmentButton,
    IonCard, IonCardContent, IonText, IonGrid, IonRow, IonCol
  ]
})
export class DashboardPage implements OnInit {
  activeTab = 'overview';
  isLoading = true;
  
  stats = {
    totalSensors: 0,
    activeSensors: 0,
    offlineSensors: 0,
    alertCount: 0,
    avgTemperature: 0,
    avgHumidity: 0
  };

  chartUrl = 'http://localhost:3000/d/technical-sensors?orgId=1&refresh=30s&kiosk=tv';

  constructor(private sensorService: SensorService) {
    addIcons({ mapOutline, refreshOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const sensors = await this.sensorService.getSensors();
      this.stats.totalSensors = sensors.length;
      this.stats.activeSensors = sensors.filter(s => s.status === 'active').length;
      this.stats.offlineSensors = sensors.filter(s => s.status === 'offline').length;
      this.stats.alertCount = sensors.filter(s => s.status === 'alert').length;
      
      // Mode démo
      this.stats.avgTemperature = 23.5;
      this.stats.avgHumidity = 65;
    } catch (error) {
      console.error('Erreur chargement données:', error);
      // Valeurs par défaut démo
      this.stats = {
        totalSensors: 28,
        activeSensors: 26,
        offlineSensors: 1,
        alertCount: 2,
        avgTemperature: 23.5,
        avgHumidity: 65
      };
    }
    this.isLoading = false;
  }

  refresh() {
    this.loadData();
  }

  segmentChanged(event: any) {
    this.activeTab = event.target.value;
  }
}
