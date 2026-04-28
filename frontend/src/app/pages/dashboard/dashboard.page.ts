import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonChip, IonIcon, IonSpinner
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { wifiOutline, batteryDeadOutline, mapOutline } from "ionicons/icons";
import { SensorService } from "../../services/sensor.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonChip, IonIcon, IonSpinner
  ]
})
export class DashboardPage implements OnInit {
  dashboardUrl!: SafeResourceUrl;
  activeDashboard = "technical";
  isLoading = true;

  technicalStats = { offline_count: 0, low_battery_count: 0 };

  dashboards: Record<string, string> = {
    technical:   "http://localhost:3000/d/technical-sensors?orgId=1&refresh=30s&kiosk=tv",
    supervision: "http://localhost:3000/d/forest-supervision?orgId=1&refresh=30s&kiosk=tv",
    network:     "http://localhost:3000/d/network-monitoring?orgId=1&refresh=30s&kiosk=tv"
  };

  dashboardLabels: Record<string, string> = {
    technical: "Technique", supervision: "Supervision", network: "Réseau"
  };

  constructor(
    private domSanitizer: DomSanitizer,
    private sensorService: SensorService
  ) {
    addIcons({ wifiOutline, batteryDeadOutline, mapOutline });
  }

  async ngOnInit() {
    this.toggleDashboard("technical");
    await this.loadStats();
  }

  toggleDashboard(type: string) {
    this.activeDashboard = type;
    this.isLoading = true;
    this.dashboardUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
      this.dashboards[type]
    );
  }

  onIframeLoad() { this.isLoading = false; }

  async loadStats() {
    try {
      const data = await this.sensorService.getTechnicalDashboard();
      this.technicalStats = data.summary;
    } catch (err) {
      console.error("Erreur stats", err);
    }
  }
}
