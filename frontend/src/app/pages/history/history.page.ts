import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem, IonItemOption,
  IonItemOptions, IonItemSliding, IonLabel, IonBadge, IonText, IonSearchbar,
  IonSegment, IonSegmentButton, IonCard, IonCardContent, IonItemDivider, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';

interface HistoryEvent {
  id: number;
  timestamp: string;
  type: 'alert' | 'offline' | 'online' | 'update' | 'error';
  sensor: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
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
    IonSearchbar, IonSegment, IonSegmentButton, IonCard, IonCardContent, IonItemDivider, IonChip
  ]
})
export class HistoryPage implements OnInit {
  activeTab = 'all';
  searchTerm = '';
  
  events: HistoryEvent[] = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      type: 'alert',
      sensor: 'SENSOR003',
      description: 'Alerte : Batterie faible (15%)',
      severity: 'high'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      type: 'offline',
      sensor: 'SENSOR004',
      description: 'Capteur hors ligne',
      severity: 'high'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      type: 'online',
      sensor: 'SENSOR002',
      description: 'Capteur reconnecté',
      severity: 'low'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      type: 'update',
      sensor: 'SENSOR001',
      description: 'Données reçues avec succès',
      severity: 'low'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      type: 'error',
      sensor: 'SENSOR005',
      description: 'Erreur de transmission',
      severity: 'medium'
    }
  ];

  get filteredEvents(): HistoryEvent[] {
    let filtered = this.events;

    if (this.activeTab !== 'all') {
      filtered = filtered.filter(e => e.type === this.activeTab);
    }

    if (this.searchTerm) {
      filtered = filtered.filter(e =>
        e.sensor.includes(this.searchTerm) ||
        e.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    return filtered;
  }

  constructor() {
    addIcons({ timeOutline });
  }

  ngOnInit() {
    // Données chargées par défaut
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      'alert': 'Alerte',
      'offline': 'Hors ligne',
      'online': 'En ligne',
      'update': 'Mise à jour',
      'error': 'Erreur'
    };
    return labels[type] || type;
  }

  getTypeColor(type: string): string {
    const colors: any = {
      'alert': 'danger',
      'offline': 'warning',
      'online': 'success',
      'update': 'primary',
      'error': 'danger'
    };
    return colors[type] || 'medium';
  }

  getSeverityColor(severity: string): string {
    const colors: any = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'success'
    };
    return colors[severity] || 'medium';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;

    return date.toLocaleDateString('fr-FR');
  }

  segmentChanged(event: any) {
    this.activeTab = event.target.value;
  }

  clearHistory() {
    if (confirm('Êtes-vous sûr de vouloir supprimer l\'historique ?')) {
      this.events = [];
    }
  }
}
