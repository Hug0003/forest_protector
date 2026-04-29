import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonIcon, IonChip, IonModal, IonInput, IonItem, IonLabel, IonSelect,
  IonSelectOption, IonTextarea, IonBadge, ToastController, NavController
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  refreshOutline, addOutline, closeOutline,
  leafOutline, hardwareChipOutline, checkmarkOutline, flameOutline,
  trashOutline, arrowBackOutline, trendingUpOutline, playOutline, pauseOutline,
  chevronUpOutline, chevronDownOutline
} from "ionicons/icons";
import * as L from "leaflet";
import "leaflet-draw";
import {
  FireSpreadPredictionRequest,
  FireSpreadPredictionResult,
  ForestService,
  Forest
} from "../../services/forest.service";
import { SensorService } from "../../services/sensor.service";

type MapMode = "view" | "draw_forest" | "view_forest" | "place_sensor";

@Component({
  selector: "app-map",
  templateUrl: "./map.page.html",
  styleUrls: ["./map.page.scss"],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonIcon, IonChip,
    IonModal, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption,
    IonTextarea, IonBadge
  ]
})
export class MapPage implements OnInit, AfterViewInit {
  @ViewChild("mapContainer", { read: ElementRef }) mapContainer!: ElementRef;

  // Carte
  map!: L.Map;
  mode: MapMode = "view";

  // For�ts
  forests: Forest[] = [];
  selectedForest: Forest | null = null;
  forestLayers: Map<number, L.Layer> = new Map();

  // Capteurs
  sensors: any[] = [];
  selectedSensor: any = null;
  sensorMarkers: Map<number, L.Marker> = new Map();
  sensorDetectionOverlay: L.LayerGroup | null = null;
  alertOverlays: L.LayerGroup | null = null;
  fireOverlay: L.LayerGroup | null = null;
  fireSimulationActive = false;
  firePoint: { lat: number; lng: number } | null = null;
  propagationSimulationActive = false;
  propagationResult: FireSpreadPredictionResult | null = null;
  propagationOverlay: L.LayerGroup | null = null;
  propagationTrail: L.Polyline | null = null;
  propagationFrontMarker: L.CircleMarker | null = null;
  propagationCone: L.Polygon | null = null;
  propagationTimer: ReturnType<typeof setInterval> | null = null;
  propagationElapsedMinutes = 0;
  propagationTimeScaleMinutesPerSecond = 15;
  propagationCurrentDistanceM = 0;
  propagationCurrentPoint: { lat: number; lng: number } | null = null;
  propagationOriginPoint: { lat: number; lng: number } | null = null;
  propagationWeatherLabel = "";
  propagationWeatherTemperatureC: number | null = null;
  propagationWeatherWindSpeedKmh: number | null = null;
  propagationWeatherWindDirectionDeg: number | null = null;
  propagationWeatherHumidityPct: number | null = null;
  bottomPanelsCollapsed = false;
  readonly SENSOR_DETECTION_RADIUS_M = 1500;

  // Dessin polygone
  drawnItems!: L.FeatureGroup;
  drawControl!: any;
  drawnPolygon: any = null;
  drawingPoints: L.LatLng[] = [];
  drawingPolyline: L.Polyline | null = null;
  drawingMarkers: L.Layer[] = [];
  isDrawing = false;
  onMapClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
  onMapContextMenuHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
  calculatedAreaHa: number | null = null;

  // Modal cration fort
  showForestModal = false;
  newForest = { name: "", description: "", forest_type: "", total_area: null as number | null };

  // Modal placement capteur
  showSensorModal = false;
  pendingSensorLatLng: L.LatLng | null = null;
  newSensor = {
    uid: "", sensor_type_id: 1, notes: ""
  };

  constructor(
    private forestService: ForestService,
    private sensorService: SensorService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({
      refreshOutline, addOutline, closeOutline,
      leafOutline, hardwareChipOutline, checkmarkOutline, flameOutline,
      trashOutline, arrowBackOutline, trendingUpOutline, playOutline, pauseOutline,
      chevronUpOutline, chevronDownOutline
    });
  }

  toggleBottomPanels() {
    this.bottomPanelsCollapsed = !this.bottomPanelsCollapsed;
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goHome() {
    this.navCtrl.navigateBack('/home');
  }

  async ngOnInit() {
    await this.loadForests();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  ionViewDidEnter() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(true), 100);
    }
  }

  // ============================================================
  // INITIALISATION CARTE
  // ============================================================
  initMap() {
    if (!this.mapContainer?.nativeElement || this.map) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [46.2276, 2.2137],
      zoom: 5
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(this.map);

    this.map.invalidateSize(true);

    // Layer pour les polygones dessins
    this.drawnItems = new L.FeatureGroup().addTo(this.map);
    this.alertOverlays = new L.LayerGroup().addTo(this.map);

    // Affiche les forts existantes
    this.drawForestLayers();
  }

  // ============================================================
  // FORTS
  // ============================================================
  async loadForests() {
    try {
      this.forests = await this.forestService.getForests();
      if (this.map) this.drawForestLayers();
    } catch (err) {
      console.error("Erreur chargement forts", err);
    }
  }

  drawForestLayers() {
    // Supprime les anciens layers
    this.forestLayers.forEach(layer => this.map.removeLayer(layer));
    this.forestLayers.clear();

    this.forests.forEach(forest => {
      if (!forest.geojson) return;

      const layer = L.geoJSON(
        { type: "Feature", geometry: forest.geojson, properties: {} } as any,
        {
          style: {
            color: "#2dd36f",
            weight: 2,
            opacity: 0.8,
            fillColor: "#2dd36f",
            fillOpacity: 0.15
          }
        }
      )
        .bindTooltip(forest.name, { permanent: true, direction: "center" })
        .on("click", () => this.selectForest(forest))
        .addTo(this.map);

      this.forestLayers.set(forest.id, layer);
    });
  }

  clearFireOverlay() {
    if (this.fireOverlay) {
      this.fireOverlay.removeFrom(this.map);
      this.fireOverlay = null;
    }
    this.firePoint = null;
  }

  drawFireOverlay(point: { lat: number; lng: number }, radiusMeters: number) {
    this.clearFireOverlay();

    this.firePoint = point;
    this.fireOverlay = L.layerGroup();

    L.circleMarker([point.lat, point.lng], {
      radius: 10,
      color: "#ffffff",
      weight: 2,
      fillColor: "#f04545",
      fillOpacity: 1
    }).addTo(this.fireOverlay);

    this.fireOverlay.addTo(this.map);
    this.map.setView([point.lat, point.lng], Math.max(this.map.getZoom(), 13), { animate: true });
  }

  clearPropagationOverlay() {
    if (this.propagationTimer) {
      clearInterval(this.propagationTimer);
      this.propagationTimer = null;
    }

    if (this.propagationOverlay) {
      this.propagationOverlay.removeFrom(this.map);
      this.propagationOverlay = null;
    }

    this.propagationTrail = null;
    this.propagationFrontMarker = null;
    this.propagationCone = null;
    this.propagationResult = null;
    this.propagationSimulationActive = false;
    this.propagationElapsedMinutes = 0;
    this.propagationCurrentDistanceM = 0;
    this.propagationCurrentPoint = null;
    this.propagationOriginPoint = null;
    this.propagationWeatherLabel = "";
    this.propagationWeatherTemperatureC = null;
    this.propagationWeatherWindSpeedKmh = null;
    this.propagationWeatherWindDirectionDeg = null;
    this.propagationWeatherHumidityPct = null;
  }

  async startPropagationSimulation() {
    if (!this.selectedForest || !this.firePoint) return;

    if (this.propagationSimulationActive) {
      this.clearPropagationOverlay();
    }

    const conditions = this.buildRandomPropagationConditions();
    this.propagationOriginPoint = { ...this.firePoint };
    this.propagationWeatherLabel = conditions.weather;
    this.propagationWeatherTemperatureC = conditions.temperature_c ?? null;
    this.propagationWeatherWindSpeedKmh = conditions.wind_speed_kmh;
    this.propagationWeatherWindDirectionDeg = conditions.wind_direction_deg;
    this.propagationWeatherHumidityPct = conditions.forest_humidity_pct;

    try {
      const prediction = await this.forestService.predictFireSpread(this.selectedForest.id, {
        forest_type: this.selectedForest.forest_type,
        wind_speed_kmh: conditions.wind_speed_kmh,
        wind_direction_deg: conditions.wind_direction_deg,
        weather: conditions.weather,
        temperature_c: conditions.temperature_c,
        forest_humidity_pct: conditions.forest_humidity_pct,
        origin_zone: conditions.origin_zone,
        time_horizon_minutes: conditions.time_horizon_minutes,
        fuel_moisture_pct: conditions.fuel_moisture_pct,
      });

      this.propagationResult = prediction;
      this.propagationSimulationActive = true;
      this.propagationElapsedMinutes = 0;
      this.propagationCurrentDistanceM = 0;
      this.propagationCurrentPoint = { ...this.firePoint };
      this.drawPropagationOverlay();
      this.updatePropagationOverlay();

      this.propagationTimer = setInterval(() => {
        if (!this.propagationResult || !this.propagationOriginPoint) return;

        this.propagationElapsedMinutes = Math.min(
          this.propagationElapsedMinutes + this.propagationTimeScaleMinutesPerSecond,
          this.propagationResult.time_horizon_minutes
        );
        const totalDistanceM = this.getPropagationDistanceAtMinutes(this.propagationElapsedMinutes);
        this.propagationCurrentDistanceM = totalDistanceM;
        this.propagationCurrentPoint = this.projectPoint(
          this.propagationOriginPoint,
          this.propagationResult.predicted_spread_direction_deg,
          totalDistanceM
        );
        this.updatePropagationOverlay();

        if (this.propagationElapsedMinutes >= this.propagationResult.time_horizon_minutes) {
          if (this.propagationTimer) {
            clearInterval(this.propagationTimer);
            this.propagationTimer = null;
          }
        }
      }, 1000);

      this.showToast(
        `Propagation lancée: ${prediction.predicted_spread_direction_label} à ${prediction.predicted_spread_speed_kmh.toFixed(1)} km/h sur ${prediction.time_horizon_minutes} min.`,
        "warning"
      );
    } catch (err: any) {
      console.error("Erreur simulation propagation feu", err);
      this.showToast(err?.error?.detail || "Erreur lors de la simulation de propagation");
    }
  }

  stopPropagationSimulation(clearResult = true) {
    if (this.propagationTimer) {
      clearInterval(this.propagationTimer);
      this.propagationTimer = null;
    }

    if (this.propagationOverlay) {
      this.propagationOverlay.removeFrom(this.map);
      this.propagationOverlay = null;
    }

    this.propagationTrail = null;
    this.propagationFrontMarker = null;
    this.propagationCone = null;
    this.propagationSimulationActive = false;
    this.propagationElapsedMinutes = 0;
    this.propagationCurrentDistanceM = 0;
    this.propagationCurrentPoint = null;
    this.propagationOriginPoint = null;

    if (clearResult) {
      this.propagationResult = null;
      this.propagationWeatherLabel = "";
      this.propagationWeatherTemperatureC = null;
      this.propagationWeatherWindSpeedKmh = null;
      this.propagationWeatherWindDirectionDeg = null;
      this.propagationWeatherHumidityPct = null;
    }
  }

  drawPropagationOverlay() {
    if (!this.propagationOriginPoint) return;

    if (this.propagationOverlay) {
      this.propagationOverlay.removeFrom(this.map);
    }

    this.propagationOverlay = L.layerGroup().addTo(this.map);
    this.propagationTrail = L.polyline([], {
      color: "#ff7a18",
      weight: 4,
      opacity: 0.9,
      dashArray: "8 8",
    }).addTo(this.propagationOverlay);

    this.propagationFrontMarker = L.circleMarker([this.propagationOriginPoint.lat, this.propagationOriginPoint.lng], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#ff4d4d",
      fillOpacity: 1,
    }).addTo(this.propagationOverlay);

    this.propagationCone = L.polygon(this.getPropagationConeLatLngs(80), {
      color: "#ffb300",
      weight: 2,
      fillColor: "#ffb300",
      fillOpacity: 0.1,
    }).addTo(this.propagationOverlay);

    this.map.setView([this.propagationOriginPoint.lat, this.propagationOriginPoint.lng], Math.max(this.map.getZoom(), 13), { animate: true });
  }

  updatePropagationOverlay() {
    if (!this.propagationOverlay || !this.propagationTrail || !this.propagationFrontMarker || !this.propagationOriginPoint || !this.propagationResult || !this.propagationCurrentPoint) {
      return;
    }

    const path = [
      [this.propagationOriginPoint.lat, this.propagationOriginPoint.lng],
      [this.propagationCurrentPoint.lat, this.propagationCurrentPoint.lng],
    ] as L.LatLngExpression[];

    this.propagationTrail.setLatLngs(path);
    this.propagationFrontMarker.setLatLng([this.propagationCurrentPoint.lat, this.propagationCurrentPoint.lng]);

    const coneLatLngs = this.getPropagationConeLatLngs(this.propagationCurrentDistanceM);
    if (this.propagationCone) {
      this.propagationCone.setLatLngs(coneLatLngs);
    } else {
      this.propagationCone = L.polygon(coneLatLngs, {
        color: "#ff7a18",
        weight: 2,
        fillColor: "#ff7a18",
        fillOpacity: 0.08,
      }).addTo(this.propagationOverlay);
    }
  }

  getPropagationStatusLabel(): string {
    if (!this.propagationResult) return "En attente";
    return `${this.propagationResult.predicted_spread_direction_label} - ${this.propagationResult.predicted_spread_speed_kmh.toFixed(1)} km/h`;
  }

  getPropagationElapsedLabel(): string {
    return `${this.propagationElapsedMinutes} min`;
  }

  getPropagationConeLatLngs(distanceMeters: number): L.LatLngExpression[] {
    if (!this.propagationOriginPoint || !this.propagationResult) return [];

    const origin = this.propagationOriginPoint;
    const direction = this.propagationResult.predicted_spread_direction_deg;
    const halfAngle = 22.5;
    const segments = 10;
    const radius = Math.max(distanceMeters, 80);
    const arcPoints: L.LatLngExpression[] = [];

    for (let index = 0; index <= segments; index++) {
      const angle = direction - halfAngle + (index / segments) * (halfAngle * 2);
      arcPoints.push(this.projectPoint(origin, angle, radius));
    }

    return [
      [origin.lat, origin.lng],
      ...arcPoints,
    ];
  }

  buildRandomPropagationConditions(): FireSpreadPredictionRequest {
    const weatherOptions = ["dry", "clear", "windy", "cloudy", "overcast", "rainy"];
    const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    const temperature_c = Math.round((8 + Math.random() * 30) * 10) / 10;
    const wind_speed_kmh = Math.round((5 + Math.random() * 45) * 10) / 10;
    const wind_direction_deg = Math.round(Math.random() * 3600) / 10;
    const forest_humidity_pct = Math.round((18 + Math.random() * 60) * 10) / 10;
    const fuel_moisture_pct = Math.round((10 + Math.random() * 40) * 10) / 10;

    return {
      forest_type: this.selectedForest?.forest_type || undefined,
      wind_speed_kmh,
      wind_direction_deg,
      weather,
      temperature_c,
      forest_humidity_pct,
      origin_zone: this.pickOriginZoneLabel(),
      time_horizon_minutes: 120,
      fuel_moisture_pct,
    };
  }

  pickOriginZoneLabel(): string {
    const zoneCandidates = (this.selectedForest?.sensors || [])
      .map((sensor: any) => sensor.zone_id)
      .filter((zoneId: any) => zoneId !== null && zoneId !== undefined);

    if (zoneCandidates.length > 0) {
      const zoneId = zoneCandidates[Math.floor(Math.random() * zoneCandidates.length)];
      return `Zone ${zoneId}`;
    }

    return `Point d'origine ${this.firePoint?.lat.toFixed(3) ?? ""}, ${this.firePoint?.lng.toFixed(3) ?? ""}`.trim();
  }

  getPropagationDistanceAtMinutes(minutes: number): number {
    if (!this.propagationResult) return 0;
    return Math.round((this.propagationResult.predicted_spread_speed_m_per_h * minutes / 60) * 10) / 10;
  }

  projectPoint(origin: { lat: number; lng: number }, bearingDeg: number, distanceMeters: number): { lat: number; lng: number } {
    const earthRadius = 6371000;
    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1 = (origin.lat * Math.PI) / 180;
    const lon1 = (origin.lng * Math.PI) / 180;
    const angularDistance = distanceMeters / earthRadius;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: (lat2 * 180) / Math.PI,
      lng: ((lon2 * 180) / Math.PI + 540) % 360 - 180,
    };
  }

  // Mode dessin polygone
  startDrawForest() {
    if (!this.map) return;

    if (this.onMapClickHandler) this.map.off("click", this.onMapClickHandler);
    if (this.onMapContextMenuHandler) this.map.off("contextmenu", this.onMapContextMenuHandler);

    this.mode = "draw_forest";
    this.isDrawing = true;
    this.calculatedAreaHa = null;
    this.drawnItems.clearLayers();
    this.drawnPolygon = null;
    this.drawingPoints = [];
    this.drawingMarkers = [];

    this.drawingPolyline = L.polyline([], {
      color: "#2dd36f",
      weight: 2,
      opacity: 0.9
    }).addTo(this.drawnItems);

    this.onMapClickHandler = (e: L.LeafletMouseEvent) => {
      if (!this.isDrawing) return;

      const point = e.latlng;
      this.drawingPoints.push(point);

      const marker = L.circleMarker(point, {
        radius: 5,
        color: "#2dd36f",
        weight: 2,
        fillColor: "#ffffff",
        fillOpacity: 1
      }).addTo(this.drawnItems);

      marker.on("click", () => {
        const lastMarker = this.drawingMarkers[this.drawingMarkers.length - 1];
        if (lastMarker === marker && this.drawingPoints.length >= 3) {
          this.finishDrawing();
        }
      });

      this.drawingMarkers.push(marker);
      this.updatePolyline();
    };

    this.onMapContextMenuHandler = () => {
      this.removeLastPoint();
    };

    this.map.on("click", this.onMapClickHandler);
    this.map.on("contextmenu", this.onMapContextMenuHandler);
  }
  updatePolyline() {
    if (this.drawingPolyline) {
      this.drawingPolyline.setLatLngs(this.drawingPoints);
    }
  }

  removeLastPoint() {
    if (this.drawingPoints.length === 0 || !this.isDrawing) return;

    this.drawingPoints.pop();
    const marker = this.drawingMarkers.pop();
    if (marker) {
      this.drawnItems.removeLayer(marker);
    }
    this.updatePolyline();
  }

  finishDrawing() {
    if (this.drawingPoints.length < 3) {
      this.showToast("Vous devez tracer au moins 3 points", "warning");
      return;
    }

    this.isDrawing = false;
    this.calculatedAreaHa = this.calculateAreaHa(this.drawingPoints);

    // Creer le polygone final
    this.drawnPolygon = L.polygon(this.drawingPoints, {
      color: "#2dd36f",
      weight: 2,
      opacity: 0.8,
      fill: true,
      fillColor: "#2dd36f",
      fillOpacity: 0.2
    });

    // Nettoyer les marqueurs et polyline temporaires
    this.drawingMarkers.forEach(m => this.drawnItems.removeLayer(m));
    this.drawingMarkers = [];
    if (this.drawingPolyline) {
      this.drawnItems.removeLayer(this.drawingPolyline);
      this.drawingPolyline = null;
    }

    // Ajouter le polygone final
    this.drawnItems.addLayer(this.drawnPolygon);

    // Desactiver les evenements
    if (this.onMapClickHandler) this.map.off("click", this.onMapClickHandler);
    if (this.onMapContextMenuHandler) this.map.off("contextmenu", this.onMapContextMenuHandler);

    // Afficher la modal
    this.showForestModal = true;
  }

  calculateAreaHa(points: L.LatLng[]): number | null {
    if (!points || points.length < 3) return null;

    const geometryUtil = (L as any).GeometryUtil;
    if (geometryUtil?.geodesicArea) {
      const areaM2 = geometryUtil.geodesicArea(points);
      if (Number.isFinite(areaM2)) {
        return Math.round((areaM2 / 10000) * 100) / 100;
      }
    }

    return null;
  }

  cancelDraw() {
    this.mode = "view";
    this.isDrawing = false;
    this.drawingPoints = [];
    this.drawingMarkers = [];
    this.drawingPolyline = null;
    this.drawnPolygon = null;
    this.calculatedAreaHa = null;

    // Désactiver les événements
    if (this.onMapClickHandler) this.map.off("click", this.onMapClickHandler);
    if (this.onMapContextMenuHandler) this.map.off("contextmenu", this.onMapContextMenuHandler);

    this.drawnItems.clearLayers();
    this.showForestModal = false;
    this.newForest = { name: "", description: "", forest_type: "", total_area: null };
  }

  async saveForest() {
    if (!this.drawnPolygon || !this.newForest.name) return;

    const latlngs = this.drawnPolygon.getLatLngs()[0] as L.LatLng[];
    const coordinates: number[][] = latlngs.map((ll: L.LatLng) => [ll.lng, ll.lat]);
    // Ferme le polygone
    coordinates.push(coordinates[0]);
    const totalArea = this.calculatedAreaHa ?? this.calculateAreaHa(latlngs);

    try {
      const created = await this.forestService.createForest({
        name: this.newForest.name,
        description: this.newForest.description,
        forest_type: this.newForest.forest_type || undefined,
        total_area: totalArea ?? undefined,
        coordinates: [coordinates]
      });

      this.forests.push(created);
      this.showForestModal = false;
      this.newForest = { name: "", description: "", forest_type: "", total_area: null };
      this.calculatedAreaHa = null;
      this.drawnItems.clearLayers();
      this.mode = "view";
      this.drawForestLayers();
      // Slectionne automatiquement la fort cre
      await this.selectForest(created);
    } catch (err: any) {
      console.error("Erreur cration fort", err);
      this.showToast(err?.error?.detail || "Erreur lors de la cration de la fort");
    }
  }

  async selectForest(forest: Forest) {
    // Charge les dtails avec capteurs
    try {
      const detail = await this.forestService.getForest(forest.id);
      this.selectedForest = detail;
      this.mode = "view_forest";
      this.clearSensorDetectionOverlay();
      this.drawSensorMarkers(detail.sensors || []);
      if (this.fireSimulationActive && this.firePoint) {
        this.drawFireOverlay(this.firePoint, 1500);
      }

      // Zoom sur la forêt
      const layer = this.forestLayers.get(forest.id);
      if (layer) this.map.fitBounds((layer as L.GeoJSON).getBounds().pad(0.1));
    } catch (err: any) {
      console.error("Erreur chargement forêt", err);
      this.showToast(err?.error?.detail || "Erreur lors du chargement de la forêt");
    }
  }

  isFireSimulationActive(): boolean {
    return this.fireSimulationActive;
  }

  async stopFireSimulation() {
    if (!this.selectedForest) return;

    try {
      const result = await this.forestService.stopFireSimulation(this.selectedForest.id);
      this.stopPropagationSimulation();
      this.fireSimulationActive = false;
      this.clearFireOverlay();
      await this.loadForests();
      await this.selectForest(this.selectedForest);
      this.showToast(`Simulation arrêtée. ${result.restored_sensors} capteur(s) remis en service.`, "success");
    } catch (err: any) {
      console.error("Erreur arrêt simulation feu", err);
      this.showToast(err?.error?.detail || "Erreur lors de l'arrêt de la simulation");
    }
  }

  closeForest() {
    this.selectedForest = null;
    this.mode = "view";
    this.clearSensorMarkers();
    // Do not clear fireOverlay or fireSimulationActive to keep it visible
    this.clearSensorDetectionOverlay();
    this.selectedSensor = null;
  }

  async deleteForest() {
    if (!this.selectedForest) return;
    try {
      this.stopPropagationSimulation();
      await this.forestService.deleteForest(this.selectedForest.id);
      this.forests = this.forests.filter(f => f.id !== this.selectedForest!.id);
      this.closeForest();
      this.drawForestLayers();
    } catch (err: any) {
      console.error("Erreur suppression forêt", err);
      this.showToast(err?.error?.detail || "Erreur lors de la suppression de la forêt");
    }
  }

  async simulateFire() {
    if (!this.selectedForest) return;

    try {
      const result = await this.forestService.simulateFire(this.selectedForest.id);
      this.fireSimulationActive = true; this.clearSensorDetectionOverlay(); this.drawFireOverlay(result.fire_point, result.radius_m || 1500);
      await this.loadForests();
      await this.selectForest(this.selectedForest);
      this.showToast(`Feu simulé sur ${result.affected_sensors} capteur(s). Un point de feu a été placé dans la forêt.`, "warning");
    } catch (err: any) {
      console.error("Erreur simulation feu", err);
      this.showToast(err?.error?.detail || "Erreur lors de la simulation du feu");
    }
  }

  // ============================================================
  // CAPTEURS
  // ============================================================
  drawSensorMarkers(sensors: any[]) {
    this.clearSensorMarkers();
    if (this.alertOverlays) {
      this.alertOverlays.clearLayers();
    }
    sensors.forEach(sensor => {
      if (!sensor.lat || !sensor.lng) return;

      if (sensor.status === 'alert' && this.alertOverlays) {
        L.circle([sensor.lat, sensor.lng], {
          radius: this.SENSOR_DETECTION_RADIUS_M,
          color: "#ffb300",
          weight: 2,
          fillColor: "#f04545",
          fillOpacity: 0.15,
          dashArray: "4 6"
        }).addTo(this.alertOverlays);
      }

      const marker = L.marker([sensor.lat, sensor.lng], {
        icon: this.getMarkerIcon(sensor.status)
      })
        .bindPopup(this.createPopupContent(sensor))
        .on("click", () => this.selectSensor(sensor))
        .addTo(this.map);
      this.sensorMarkers.set(sensor.id, marker);
    });
  }

  selectSensor(sensor: any) {
    this.selectedSensor = sensor;
    const marker = this.sensorMarkers.get(sensor.id);
    if (marker) {
      const latLng = marker.getLatLng();
      this.map.setView(latLng, Math.max(this.map.getZoom(), 14), {
        animate: true
      });
      marker.openPopup();
      this.drawSensorDetectionOverlay(latLng, this.SENSOR_DETECTION_RADIUS_M);
    }
  }

  clearSensorDetectionOverlay() {
    if (this.sensorDetectionOverlay) {
      this.sensorDetectionOverlay.removeFrom(this.map);
      this.sensorDetectionOverlay = null;
    }
  }

  drawSensorDetectionOverlay(latLng: L.LatLng, radiusMeters: number) {
    // remove any fire overlay so sensor detection is prominent
    this.clearSensorDetectionOverlay();
    this.clearFireOverlay();
    this.sensorDetectionOverlay = L.layerGroup();

    // more visible styling: bold orange/yellow circle with slight fill
    L.circle(latLng, {
      radius: radiusMeters,
      color: "#ffb300",
      weight: 4,
      fillColor: "#ffecb3",
      fillOpacity: 0.22
    }).addTo(this.sensorDetectionOverlay);

    // center marker
    L.circleMarker(latLng, {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#ff6f00",
      fillOpacity: 1
    }).addTo(this.sensorDetectionOverlay);

    this.sensorDetectionOverlay.addTo(this.map);
  }

  async deleteSensor(sensor: any) {
    if (!sensor) return;
    try {
      await this.forestService.deleteSensor(sensor.id);
      // retire le marqueur
      const marker = this.sensorMarkers.get(sensor.id);
      if (marker) {
        this.map.removeLayer(marker);
        this.sensorMarkers.delete(sensor.id);
      }
      // retire de la liste
      if (this.selectedForest?.sensors) {
        this.selectedForest.sensors = this.selectedForest.sensors.filter((s: any) => s.id !== sensor.id);
      }
      if (this.selectedSensor?.id === sensor.id) {
        this.selectedSensor = null;
        this.clearSensorDetectionOverlay();
      }
    } catch (err: any) {
      console.error("Erreur suppression capteur", err);
      this.showToast(err?.error?.detail || "Erreur lors de la suppression du capteur");
    }
  }

  clearSensorMarkers() {
    this.sensorMarkers.forEach(m => this.map.removeLayer(m));
    this.sensorMarkers.clear();
  }

  startPlaceSensor() {
    if (!this.selectedForest) return;
    this.mode = "place_sensor";

    // Curseur crosshair
    this.map.getContainer().style.cursor = "crosshair";

    this.map.once("click", (e: L.LeafletMouseEvent) => {
      this.map.getContainer().style.cursor = "";
      this.pendingSensorLatLng = e.latlng;
      this.newSensor = { uid: `SENSOR-${Date.now().toString().slice(-4)}`, sensor_type_id: 1, notes: "" };
      this.showSensorModal = true;
      this.mode = "view_forest";
    });
  }

  cancelSensor() {
    this.showSensorModal = false;
    this.pendingSensorLatLng = null;
    this.mode = "view_forest";
    this.map.getContainer().style.cursor = "";
  }

  async saveSensor() {
    if (!this.selectedForest || !this.pendingSensorLatLng) return;
    try {
      const created = await this.forestService.createSensor({
        uid: this.newSensor.uid,
        sensor_type_id: this.newSensor.sensor_type_id,
        forest_id: this.selectedForest.id,
        lat: this.pendingSensorLatLng.lat,
        lng: this.pendingSensorLatLng.lng,
        notes: this.newSensor.notes
      });

      // Ajoute le marqueur immdiatement
      const marker = L.marker([created.lat, created.lng], {
        icon: this.getMarkerIcon("active")
      })
        .bindPopup(`<b>${created.uid}</b><br>Statut : Actif`)
        .addTo(this.map);
      this.sensorMarkers.set(created.id, marker);

      // Ajoute  la liste
      if (this.selectedForest.sensors) {
        this.selectedForest.sensors.push(created);
      }

      this.showSensorModal = false;
      this.pendingSensorLatLng = null;
    } catch (err: any) {
      console.error("Erreur cration capteur", err);
      this.showToast(err?.error?.detail || "Erreur lors de la cration du capteur");
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================
  getMarkerIcon(status: string): L.Icon {
    const colors: Record<string, string> = {
      active: "#2dd36f", alert: "#f04545", offline: "#ffc409"
    };
    const color = colors[status] || "#999";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40">
      <path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z"
            fill="${color}" stroke="white" stroke-width="1"/>
      <circle cx="16" cy="12" r="5" fill="white"/>
    </svg>`;
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40]
    });
  }

  createPopupContent(sensor: any): string {
    return `
      <div style="font-size:13px;min-width:140px;padding:4px">
        <strong>${sensor.uid}</strong><br>
        <span style="color:${this.getStatusColor(sensor.status)}">
          ? ${this.getStatusLabel(sensor.status)}
        </span><br>
        ${sensor.battery_level ? `Batterie : ${sensor.battery_level.toFixed(0)}%<br>` : ""}
        ${sensor.last_seen ? `Vu : ${new Date(sensor.last_seen).toLocaleString("fr-FR")}` : ""}
      </div>`;
  }

  getStatusColor(status: string): string {
    return ({ active: "#2dd36f", alert: "#f04545", offline: "#ffc409" } as any)[status] || "#999";
  }

  getStatusLabel(status: string): string {
    return ({ active: "Actif", alert: "Alerte", offline: "Hors ligne" } as any)[status] || status;
  }

  refresh() { this.loadForests(); }
}
