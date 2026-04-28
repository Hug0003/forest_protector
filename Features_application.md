# ✨ Cœur de l’Application

## 1. Flux de Données (Data Ingest)
Le système agrège trois types de sources pour une précision maximale :
* **Données IoT (Micro-local)** : 
  * ID et Coordonnées GPS du capteur.
  * Température et Hygrométrie (Air & Sol).
  * Concentration de gaz (CO / Particules fines / Fumée).
  * Télémétrie : État batterie, inclinaison (détection de vol/chute).
* **Données Vision (Meso-local - Pylône)** :
  * Flux vidéo basse résolution (pour levée de doute).
  * Métadonnées de l'IA : "Score de confiance fumée" (%).
  * Azimut du départ de feu (angle de la caméra).
* **Données Externes (Macro)** :
  * Pédologie : Cartographie du type de combustible (Fougères, Résineux, Humus).
  * Météo : Indice d'inflammabilité (FWI - Fire Weather Index), vitesse du vent, foudre.
  * Satellite : Anomalies thermiques (Points chauds infrarouges).

## 2. Cartographie Interactive (Vue Opérationnelle)
* **Moteur de rendu** : Carte multicouche (Mapbox/Leaflet) avec toggle :
  * Layer **"Risque Sol"** : Zones colorées selon la inflammabilité (ex: Rouge pour les zones sèches de fougères).
  * Layer **"Capteurs"** : Statut en temps réel (Vert = OK, Rouge = Alerte, Gris = Hors-ligne).
* **Fonctionnalités avancées** :
  * **Zones de Chaleur (Heatmaps)** : Moyenne thermique par parcelle.
  * **Géolocalisation "Agent Terrain"** : Affichage de la position des gardes forestiers via GPS mobile pour coordination en cas d'incendie.
  * **Vue Hybride** : Passage 2D / 3D / Satellite pour analyser le relief (crucial pour la propagation du feu).

## 3. Dashboard Supervision & Maintenance (Vue Technique)
C'est ici que l'expertise Système et DevOps intervient.
* **Santé du Parc IoT** :
  * Alerte **"Capteur Muet"** (Perte de signal heartbeat).
  * Alerte **"Sabotage"** (Accéléromètre détectant un déplacement anormal).
  * Monitoring d'autonomie : Prédiction de fin de batterie par IA.
* **Supervision Réseau & Infrastructure** :
  * Latence LoRaWAN/Satellite : Temps de transit de la donnée.
  * Taux de perte de paquets : Qualité du signal en forêt dense.
  * Analyse de coûts : Volume de données transitant par satellite (pour éviter les dépassements de budget API).
  * Audit Log : Journal des accès et des modifications système (Traçabilité Cyber).

## 4. Intelligence Alerte & Prédiction
* **Moteur de corrélation** : L'IA ne déclenche une "Alerte Critique" que si au moins deux sources concordent (ex: Fumée détectée par caméra + Pic de chaleur IoT).
* **Fiche de Sinistre Automatique** : En cas d'alerte, génération d'un rapport PDF instantané :
  * Coordonnées GPS + Accès le plus proche pour les camions.
  * Vitesse de propagation estimée (Vent + Type de bois).
  * Zones sensibles à proximité (habitations, zones protégées).

## 5. Sécurité & Accès (RBAC)
* **Authentification Forte (MFA)** : Obligatoire pour tous les comptes.
* **Profilils Utilisateurs** :
  * **Gardes Forestiers** : Surveillance quotidienne, rapports de terrain.
  * **Pompiers (SDIS)** : Accès "Urgence" avec vue temps réel et contrôle des caméras pylônes.
  * **Propriétaires/État** : Rapports statistiques sur la santé du parc et bilans annuels.
  * **Administrateurs** (Votre équipe) : Gestion des clés API, mise à jour des modèles IA, configuration réseau.

## 6. Évolution "Next Steps" (Post-8 mois)
* Ajout de la détection d'espèces invasives par l'IA des pylônes.
* Interfaçage avec les drones de reconnaissance automatique.
