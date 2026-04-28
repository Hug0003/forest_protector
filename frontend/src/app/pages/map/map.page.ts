import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonList, IonItem,
  IonLabel, IonChip, IonText, IonSpinner, IonCard, IonCardContent, IonItemDivider
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline, refreshOutline } from "ionicons/icons";
import { SensorService } from "../../services/sensor.service";

@Component({
  selector: "app-map",
  templateUrl: "./map.page.html",
  styleUrls: ["./map.page.scss"],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonList, IonItem,
    IonLabel, IonChip, IonText, IonSpinner, IonCard, IonCardContent, IonItemDivider
  ]
})
export class MapPage implements OnInit {
  sensors: any[] = [];
  isLoading = true;
  selectedSensor: any = null;

  constructor(private sensorService: SensorService) {
    addIcons({ arrowBackOutline, refreshOutline });
  }

  ngOnInit() {
    this.loadSensors();
  }

  async loadSensors() {
    this.isLoading = true;
    try {
      this.sensors = await this.sensorService.getSensors();
    } catch (error) {
      console.error("Erreur chargement capteurs:", error);
      // Mode démo
      this.sensors = [
        { id: 1, uid: "SENSOR001", status: "active", lat: 48.8566, lng: 2.3522, zone_id: 1, battery_level: 85 },
        { id: 2, uid: "SENSOR002", status: "active", lat: 48.8600, lng: 2.3500, zone_id: 1, battery_level: 92 },
        { id: 3, uid: "SENSOR003", status: "alert", lat: 48.8550, lng: 2.3550, zone_id: 2, battery_level: 15 },
        { id: 4, uid: "SENSOR004", status: "offline", lat: 48.8580, lng: 2.3600, zone_id: 2, battery_level: 5 }
      ];
    }
    this.isLoading = false;
  }

  selectSensor(sensor: any) {
    this.selectedSensor = sensor;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case "active": return "success";
      case "alert": return "danger";
      case "offline": return "warning";
      default: return "medium";
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case "active": return "Actif";
      case "alert": return "Alerte";
      case "offline": return "Hors ligne";
      default: return status;
    }
  }
}
