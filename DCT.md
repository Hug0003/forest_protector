# 🛠️ Dossier de Conception Technique (DCT)

## 🚀 Objectifs de Développement
* Créer l’application
* Créer un site de présentation du produit
* Le tout sous **Docker** et workflow **CI/CD**

## 💻 Stack Technique
* **Angular (Ionic)** → Interface web et mobile.
* **Python** → Traitement des données des capteurs.
* **TimescaleDB (PostgreSQL)** → Base de données avec une gestion géospatiale.

---

## 💾 Architecture de la Base de Données

### A. Table `forest_zones` (Spatial)
Stocke les polygones des différentes parcelles de la forêt.
* **`id`** : Serial (PK)
* **`name`** : Varchar (ex: "Parcelle Nord-Est")
* **`tree_species`** : Varchar (utile pour le risque incendie : résineux vs feuillus)
* **`geom`** : Geometry(Polygon, 4326) (Tracé de la zone sur la carte)

### B. Table `sensors` (Référentiel)
Stocke les métadonnées des boîtiers.
* **`id`** : Serial (PK)
* **`uid`** : Varchar UNIQUE (Identifiant matériel du capteur)
* **`zone_id`** : Integer (FK vers `forest_zones`)
* **`installation_date`** : Date
* **`location`** : Geometry(Point, 4326) (Coordonnées GPS précises du capteur)
* **`status`** : Enum (actif, maintenance, alerte)

### C. Table `sensor_data` (Hypertable TimescaleDB)
C'est ici que sont stockés les millions de relevés.
* **`time`** : TIMESTAMPTZ (Partition Key)
* **`sensor_id`** : Integer (FK vers `sensors`)
* **`temperature`** : Float
* **`air_humidity`** : Float
* **`soil_moisture`** : Float (Crucial pour sécheresse/inondation)
* **`smoke_level`** : Float (Pour la détection incendie)
* **`battery_level`** : Float (Pour la maintenance)
