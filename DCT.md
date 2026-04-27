# 🌲 Dossier de Conception Technique (DCT) - Système de Surveillance Forestière

Ce document détaille l'architecture logicielle, la stack technologique et la structure de données du projet de surveillance environnementale.

## 🚀 Objectifs du Projet
* **Application Mobile/Web :** Interface utilisateur pour la visualisation en temps réel.
* **Site Vitrine :** Présentation marketing et technique du produit.
* **Infrastructure :** Déploiement conteneurisé avec automatisation CI/CD.

## 🛠 Stack Technique
* **Frontend :** Angular avec Ionic (Multiplateforme Web/Mobile).
* **Backend :** Python (FastAPI/Flask) pour le traitement des données capteurs.
* **Base de données :** TimescaleDB (PostgreSQL) avec extension PostGIS pour les données géospatiales.
* **DevOps :** Docker & Docker Compose, Workflow CI/CD (GitHub Actions ou GitLab CI).

---

## 💾 Architecture de la Base de Données (PostGIS + TimescaleDB)

Le système utilise une base de données relationnelle optimisée pour les séries temporelles et les calculs géographiques.

### A. Zones Forestières (`forest_zones`)
Cette table stocke les polygones représentant les parcelles de la forêt.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | Identifiant unique de la zone. |
| `name` | VARCHAR | Nom de la parcelle (ex: "Parcelle Nord-Est"). |
| `tree_species` | VARCHAR | Essence d'arbres (Résineux, feuillus, etc.). |
| `geom` | GEOMETRY(POLYGON, 4326) | Tracé géographique de la zone. |

### B. Référentiel Capteurs (`sensors`)
Stocke les métadonnées et l'état des boîtiers déployés sur le terrain.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | Identifiant unique. |
| `uid` | VARCHAR (UNIQUE) | ID matériel du capteur. |
| `zone_id` | INTEGER (FK) | Référence à la table `forest_zones`. |
| `installation_date` | DATE | Date de mise en service. |
| `location` | GEOMETRY(POINT, 4326) | Coordonnées GPS précises du boîtier. |
| `status` | ENUM | État du capteur : `actif`, `maintenance`, `alerte`. |

### C. Relevés Temps Réel (`sensor_data`)
*Hypertables TimescaleDB partitionnée par le temps.*

| Champ | Type | Description |
| :--- | :--- | :--- |
| `time` | TIMESTAMPTZ (PK) | Horodatage du relevé (Clé de partitionnement). |
| `sensor_id` | INTEGER (FK) | Référence au capteur émetteur. |
| `temperature` | FLOAT | Température ambiante. |
| `air_humidity` | FLOAT | Humidité de l'air. |
| `soil_moisture` | FLOAT | Humidité du sol (Détection sécheresse). |
| `smoke_level` | FLOAT | Niveau de fumée (Alerte incendie). |
| `battery_level` | FLOAT | Niveau d'énergie restant. |

---

## 🏗 Déploiement & CI/CD
L'intégralité de la stack est orchestrée via **Docker**.
1.  **Build :** Création des images Angular et Python.
2.  **Test :** Validation automatisée du code lors des Push.
3.  **Deploy :** Mise à jour automatique des containers sur l'infrastructure Azure (VM Debian).