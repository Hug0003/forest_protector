import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonChip, IonSpinner, IonCard, IonCardContent, IonCardHeader, IonCardTitle
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline, refreshOutline, mapOutline } from "ionicons/icons";
import { SensorService } from "../../services/sensor.service";
import * as L from "leaflet";

interface SensorMarker {
  sensor: any;
  marker: L.Marker;
}

@Component({
  selector: "app-map",
  templateUrl: "./map.page.html",
  styleUrls: ["./map.page.scss"],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonChip, IonSpinner, 
    IonCard, IonCardContent, IonCardHeader, IonCardTitle
  ]
})
export class MapPage implements OnInit, AfterViewInit {
  @ViewChild("mapContainer", { read: ElementRef }) mapContainer!: ElementRef;

  sensors: any[] = [];
  isLoading = true;
  selectedSensor: any = null;
  map!: L.Map;
  sensorMarkers: SensorMarker[] = [];

  constructor(private sensorService: SensorService) {
    addIcons({ arrowBackOutline, refreshOutline, mapOutline });
  }

  ngOnInit() {
    this.loadSensors();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ionViewDidEnter() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  initMap() {
    if (!this.mapContainer?.nativeElement) return;

    // Créer la carte centrée sur la France
    this.map = L.map(this.mapContainer.nativeElement).setView([46.2276, 2.2137], 6);

    // Ajouter le layer OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(this.map);

    // Ajouter les marqueurs des capteurs
    this.addSensorMarkers();
  }

  async loadSensors() {
    this.isLoading = true;
    try {
      this.sensors = await this.sensorService.getSensors();
    } catch (error) {
      console.error("Erreur chargement capteurs:", error);
      // Mode démo
      this.sensors = [
        { id: 1, uid: "SENSOR001", status: "active", lat: 48.8566, lng: 2.3522, zone_id: 1, battery_level: 85, last_seen: "2 min" },
        { id: 2, uid: "SENSOR002", status: "active", lat: 48.8600, lng: 2.3500, zone_id: 1, battery_level: 92, last_seen: "5 min" },
        { id: 3, uid: "SENSOR003", status: "alert", lat: 48.8550, lng: 2.3550, zone_id: 2, battery_level: 15, last_seen: "1 min" },
        { id: 4, uid: "SENSOR004", status: "offline", lat: 48.8580, lng: 2.3600, zone_id: 2, battery_level: 5, last_seen: "45 min" },
        { id: 5, uid: "SENSOR005", status: "active", lat: 46.5197, lng: 2.2137, zone_id: 3, battery_level: 78, last_seen: "10 min" }
      ];
    }
    this.isLoading = false;
    if (this.map) {
      this.addSensorMarkers();
    }
  }

  addSensorMarkers() {
    if (!this.map) return;

    // Supprimer les anciens marqueurs
    this.sensorMarkers.forEach(sm => {
      this.map.removeLayer(sm.marker);
    });
    this.sensorMarkers = [];

    // Ajouter les nouveaux marqueurs
    this.sensors.forEach(sensor => {
      const icon = this.getMarkerIcon(sensor.status);
      const marker = L.marker([sensor.lat, sensor.lng], { icon })
        .bindPopup(this.createPopupContent(sensor))
        .addTo(this.map);

      marker.on("click", () => this.selectSensor(sensor));
      this.sensorMarkers.push({ sensor, marker });
    });

    // Adapter la vue à tous les marqueurs
    if (this.sensorMarkers.length > 0) {
      const group = new L.FeatureGroup(this.sensorMarkers.map(sm => sm.marker));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  getMarkerIcon(status: string): L.Icon {
    const colors: { [key: string]: string } = {
      "active": "#2dd36f",
      "alert": "#f04545",
      "offline": "#ffc409"
    };

    const color = colors[status] || "#999";

    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${this.getSVGIcon(color)}`,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40]
    });
  }

  getSVGIcon(color: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="1"/><circle cx="16" cy="12" r="5" fill="white"/></svg>`;
    return btoa(svg);
  }

  selectSensor(sensor: any) {
    this.selectedSensor = sensor;
    const marker = this.sensorMarkers.find(sm => sm.sensor.id === sensor.id)?.marker;
    if (marker) {
      marker.openPopup();
      this.map.panTo(marker.getLatLng());
    }
  }

  createPopupContent(sensor: any): string {
    return `
      <div style="font-size: 12px; min-width: 150px;">
        <strong>${sensor.uid}</strong><br>
        <span style="color: ${this.getStatusColor(sensor.status)}">● ${this.getStatusLabel(sensor.status)}</span><br>
        Zone: ${sensor.zone_id}<br>
        Batterie: ${sensor.battery_level}%<br>
        Vu: ${sensor.last_seen}
      </div>
    `;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case "active": return "#2dd36f";
      case "alert": return "#f04545";
      case "offline": return "#ffc409";
      default: return "#999";
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

  refresh() {
    this.loadSensors();
  }
}
