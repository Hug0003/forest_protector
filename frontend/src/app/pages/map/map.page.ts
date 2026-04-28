import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { refreshOutline, barChartOutline } from "ionicons/icons";
import * as L from "leaflet";
import { SensorService, Sensor } from "../../services/sensor.service";

@Component({
  selector: "app-map",
  templateUrl: "./map.page.html",
  styleUrls: ["./map.page.scss"],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon
  ]
})
export class MapPage implements OnInit, OnDestroy {
  map!: L.Map;
  sensorMarkers!: L.LayerGroup;
  private refreshInterval: any;

  filters = {
    showAlerts: true,
    showBatteryLow: false,
    treeSpecies: "all",
    sensorType: "all"
  };

  stats = { total: 0, active: 0, offline: 0, alert: 0 };

  constructor(private sensorService: SensorService) {
    addIcons({ refreshOutline, barChartOutline });
  }

  async ngOnInit() {
    setTimeout(async () => {
      this.initMap();
      await this.loadSensors();
      this.setupRealTimeUpdates();
    }, 300);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.map) this.map.remove();
  }

  initMap() {
    this.map = L.map("map", { center: [48.8566, 2.3522], zoom: 6 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(this.map);
    this.sensorMarkers = L.layerGroup().addTo(this.map);
    this.map.locate({ setView: true, maxZoom: 13 });
  }

  async loadSensors() {
    try {
      const sensors = await this.sensorService.getSensors(this.filters);
      this.sensorMarkers.clearLayers();
      this.updateStats(sensors);
      sensors.forEach(sensor => {
        if (!sensor.lat || !sensor.lng) return;
        L.marker([sensor.lat, sensor.lng], { icon: this.getSensorIcon(sensor) })
          .bindPopup(this.buildPopup(sensor))
          .on("click", () => this.showSensorDetail(sensor))
          .addTo(this.sensorMarkers);
      });
    } catch (err) {
      console.error("Erreur chargement capteurs", err);
    }
  }

  getSensorIcon(sensor: Sensor): L.Icon {
    const colorMap: Record<string, string> = {
      active: "green", alert: "red",
      offline: "grey", maintenance: "orange"
    };
    const color = colorMap[sensor.status] || "blue";
    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], shadowSize: [41, 41]
    });
  }

  buildPopup(sensor: Sensor): string {
    return `
      <div style="min-width:160px">
        <b>${sensor.uid}</b><br>
        Statut : <b>${sensor.status}</b><br>
        ${sensor.battery_level ? `Batterie : ${sensor.battery_level.toFixed(0)}%<br>` : ""}
        ${sensor.last_seen ? `Vu : ${new Date(sensor.last_seen).toLocaleString("fr-FR")}` : "Non vu"}
      </div>`;
  }

  async showSensorDetail(sensor: Sensor) {
    try {
      const data = await this.sensorService.getSensorData(sensor.id, "1h");
      const last = data[0];
      if (!last) return;
      L.popup()
        .setLatLng([sensor.lat, sensor.lng])
        .setContent(`
          <div style="padding:8px">
            <h3 style="margin:0 0 8px">${sensor.uid}</h3>
            <p>Température : <b>${last.avg_temperature?.toFixed(1) ?? "N/A"} °C</b></p>
            <p>Humidité air : <b>${last.avg_air_humidity?.toFixed(1) ?? "N/A"} %</b></p>
            <p>Humidité sol : <b>${last.avg_soil_moisture?.toFixed(1) ?? "N/A"} %</b></p>
            <p>Batterie min : <b>${last.min_battery_level?.toFixed(0) ?? "N/A"} %</b></p>
          </div>`)
        .openOn(this.map);
    } catch (err) {
      console.error("Erreur détail capteur", err);
    }
  }

  updateStats(sensors: Sensor[]) {
    this.stats.total   = sensors.length;
    this.stats.active  = sensors.filter(s => s.status === "active").length;
    this.stats.offline = sensors.filter(s => s.status === "offline").length;
    this.stats.alert   = sensors.filter(s => s.status === "alert").length;
  }

  setupRealTimeUpdates() {
    this.refreshInterval = setInterval(() => this.loadSensors(), 30000);
  }

  async applyFilters() { await this.loadSensors(); }
}
