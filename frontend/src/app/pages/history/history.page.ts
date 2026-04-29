import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem, IonItemOption,
  IonItemOptions, IonItemSliding, IonLabel, IonBadge, IonText, IonSearchbar,
  IonSegment, IonSegmentButton, IonCard, IonCardContent, IonItemDivider, IonChip,
  IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, arrowBack, refreshOutline, alertCircleOutline, checkmarkCircleOutline, trashOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface RealAlert {
  id: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric_value: number | null;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string | null;
  resolved_at: string | null;
  sensor_uid: string | null;
  forest_name: string | null;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonList, IonItem, IonItemOption,
    IonItemOptions, IonItemSliding, IonLabel, IonBadge, IonText,
    IonSearchbar, IonSegment, IonSegmentButton, IonCard, IonCardContent,
    IonItemDivider, IonChip, IonSpinner, IonRefresher, IonRefresherContent
  ]
})
export class HistoryPage implements OnInit {
  activeTab = 'all';
  searchTerm = '';
  isLoading = true;
  alerts: RealAlert[] = [];

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {
    addIcons({ timeOutline, arrowBack, refreshOutline, alertCircleOutline, checkmarkCircleOutline, trashOutline });
  }

  get filteredAlerts(): RealAlert[] {
    let filtered = this.alerts;

    if (this.activeTab === 'active') {
      filtered = filtered.filter(a => a.status === 'active');
    } else if (this.activeTab === 'critical') {
      filtered = filtered.filter(a => a.severity === 'critical');
    } else if (this.activeTab === 'resolved') {
      filtered = filtered.filter(a => a.status === 'resolved');
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.sensor_uid || '').toLowerCase().includes(term) ||
        (a.message || '').toLowerCase().includes(term) ||
        (a.forest_name || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  ngOnInit() {
    this.loadAlerts();
  }

  async loadAlerts() {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.http.get<{ alerts: RealAlert[]; total: number }>(`${this.api}/api/v1/alerts`)
      );
      this.alerts = response.alerts;
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      this.alerts = [];
    } finally {
      this.isLoading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadAlerts();
    event.target.complete();
  }

  getSeverityColor(severity: string): string {
    const colors: any = {
      'critical': 'danger',
      'warning': 'warning',
      'info': 'primary'
    };
    return colors[severity] || 'medium';
  }

  getSeverityLabel(severity: string): string {
    const labels: any = {
      'critical': '🔴 Critique',
      'warning': '⚠️ Attention',
      'info': 'ℹ️ Info'
    };
    return labels[severity] || severity;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'active': 'danger',
      'acknowledged': 'warning',
      'resolved': 'success'
    };
    return colors[status] || 'medium';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'active': 'Active',
      'acknowledged': 'Traitée',
      'resolved': 'Résolue'
    };
    return labels[status] || status;
  }

  formatTime(timestamp: string | null): string {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `il y a ${minutes}m`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  segmentChanged(event: any) {
    this.activeTab = event.target.value;
  }
}
