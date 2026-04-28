import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonChip, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline, refreshOutline } from "ionicons/icons";
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
  showDetails = false;
  map!: L.Map;
  sensorMarkers: SensorMarker[] = [];
  forestLayer!: L.GeoJSON;

  constructor(private sensorService: SensorService) {
    addIcons({ arrowBackOutline, refreshOutline });
  }

  ngOnInit() {
    this.loadSensors();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  ionViewDidEnter() {
    if (this.map) this.map.invalidateSize();
  }

  initMap() {
    if (!this.mapContainer?.nativeElement) return;
    if (this.map) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [46.2276, 2.2137],
      zoom: 6,
      renderer: L.canvas()
    });

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    });

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri" }
    );

    const forestOverlay = this.createForestLayer();

    osm.addTo(this.map);
    forestOverlay.addTo(this.map);

    L.control.layers(
      { "Plan": osm, "Satellite": satellite },
      { "Forêts": forestOverlay },
      { collapsed: false, position: 'topright' }
    ).addTo(this.map);

    if (this.sensors.length > 0) this.addSensorMarkers();
  }

  async loadSensors() {
    this.isLoading = true;
    try {
      this.sensors = await this.sensorService.getSensors();
    } catch (error) {
      console.error("Erreur chargement capteurs � mode d�mo activ�");
      this.sensors = [
        { id: 1, uid: "SENSOR-001", status: "active",  lat: 48.8566, lng: 2.3522, zone_id: 1, battery_level: 85,  last_seen: "2 min" },
        { id: 2, uid: "SENSOR-002", status: "active",  lat: 48.8600, lng: 2.3500, zone_id: 1, battery_level: 92,  last_seen: "5 min" },
        { id: 3, uid: "SENSOR-003", status: "alert",   lat: 48.8550, lng: 2.3550, zone_id: 2, battery_level: 15,  last_seen: "1 min" },
        { id: 4, uid: "SENSOR-004", status: "offline", lat: 48.8580, lng: 2.3600, zone_id: 2, battery_level: 5,   last_seen: "45 min" },
        { id: 5, uid: "SENSOR-005", status: "active",  lat: 46.5197, lng: 2.2137, zone_id: 3, battery_level: 78,  last_seen: "10 min" }
      ];
    }
    this.isLoading = false;
    if (this.map) this.addSensorMarkers();
  }

  addSensorMarkers() {
    if (!this.map) return;
    this.sensorMarkers.forEach(sm => this.map.removeLayer(sm.marker));
    this.sensorMarkers = [];

    this.sensors.forEach(sensor => {
      if (!sensor.lat || !sensor.lng) return;
      const marker = L.marker([sensor.lat, sensor.lng], {
        icon: this.getMarkerIcon(sensor.status)
      })
        .bindPopup(this.createPopupContent(sensor))
        .addTo(this.map);

      marker.on("click", () => this.selectSensor(sensor));
      this.sensorMarkers.push({ sensor, marker });
    });

    if (this.sensorMarkers.length > 0) {
      const group = new L.FeatureGroup(this.sensorMarkers.map(sm => sm.marker));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  getMarkerIcon(status: string): L.Icon {
    const colors: Record<string, string> = {
      active:  "#2dd36f",
      alert:   "#f04545",
      offline: "#ffc409"
    };
    const color = colors[status] || "#999";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="1"/><circle cx="16" cy="12" r="5" fill="white"/></svg>`;
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
      iconSize:    [32, 40],
      iconAnchor:  [16, 40],
      popupAnchor: [0, -40]
    });
  }

  createForestLayer(): L.GeoJSON {
    const forestGeoJson: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Forêt de Fontainebleau', type: 'Forêt domaniale', area: '25 000 ha' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.5, 48.2], [2.8, 48.2], [2.8, 48.0], [2.5, 48.0], [2.5, 48.2]]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Forêt de Rambouillet', type: 'Forêt domaniale', area: '22 000 ha' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[1.5, 48.7], [1.8, 48.7], [1.8, 48.5], [1.5, 48.5], [1.5, 48.7]]]
          }
        }
      ]
    };

    return L.geoJSON(forestGeoJson, {
      style: (feature: any) => ({
        color: '#2d8c35',
        fillColor: '#70b468',
        weight: 1.5,
        fillOpacity: 0.45
      }),
      onEachFeature: (feature: any, layer: L.Layer) => {
        layer.bindPopup(`
          <strong>${feature.properties.name}</strong><br>
          Type: ${feature.properties.type}<br>
          Superficie: ${feature.properties.area}
        `);
      }
    });
  }

  createPopupContent(sensor: any): string {
    return `
      <div style="font-size:13px;min-width:150px;padding:4px">
        <strong>${sensor.uid}</strong><br>
        <span style="color:${this.getStatusColor(sensor.status)}">? ${this.getStatusLabel(sensor.status)}</span><br>
        Zone : ${sensor.zone_id}<br>
        Batterie : ${sensor.battery_level}%<br>
        Vu : ${sensor.last_seen}
      </div>`;
  }

  selectSensor(sensor: any) {
    this.selectedSensor = sensor;
    this.showDetails = false;
    const sm = this.sensorMarkers.find(s => s.sensor.id === sensor.id);
    if (sm) {
      sm.marker.openPopup();
      this.map.panTo(sm.marker.getLatLng());
    }
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      active: "#2dd36f", alert: "#f04545", offline: "#ffc409"
    };
    return map[status] || "#999";
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: "Actif", alert: "Alerte", offline: "Hors ligne"
    };
    return map[status] || status;
  }

  refresh() { this.loadSensors(); }
}
