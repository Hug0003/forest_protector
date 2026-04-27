# 🏗️ Dossier d'Architecture Technique (DAT) - Infrastructure Azure

## 1. Vue d'Ensemble
L'infrastructure est déployée sur le cloud **Microsoft Azure** selon une topologie segmentée. L'objectif est d'isoler les environnements de calcul, de données et d'intelligence artificielle afin de garantir une sécurité maximale et une gestion granulaire des flux. L'ensemble des services applicatifs est conteneurisé sous **Docker**, déployé sur des instances **Debian GNU/Linux (CLI)**.

## 2. Infrastructure Réseau (Networking)
La segmentation est assurée par la création de **4 Virtual Networks (VNet)** distincts, garantissant une isolation de niveau 3 (OSI) :

* **VNet-MQTT :** Zone d'ingestion dédiée à la simulation et à la réception des données terrain.
* **VNet-IA :** Zone de calcul isolée pour le traitement des données et l'exécution des modèles.
* **VNet-API :** Zone d'exposition des services vers les clients mobiles.
* **VNet-Prod :** Zone d'orchestration et services cœurs de l'application.

**Interconnexion :** Le routage inter-VNet est assuré par du **VNet Peering** configuré en topologie *Hub-and-Spoke*, permettant une communication privée sur le backbone Azure sans exposition sur l'Internet public.

## 3. Instances de Calcul (Compute)
L'architecture repose sur **4 Machines Virtuelles (VM)** sous distribution **Debian**. Le choix de Debian garantit stabilité, légèreté et un contrôle total sur le durcissement (hardening) du système.

| VM | Rôle | OS / Runtime |
| :--- | :--- | :--- |
| **VM-Prod** | Orchestration et logique métier | Debian + Docker |
| **VM-IA** | Inférence et modèles d'apprentissage | Debian + Docker |
| **VM-MQTT** | Broker MQTT et simulation de capteurs | Debian + Docker |
| **VM-API** | Passerelle Backend (FastAPI / Node.js) | Debian + Docker |

## 4. Stockage et Persistance
Chaque VM dispose d'un **Azure Managed Disk** indépendant pour assurer la persistance des données containers :
* **Volumes Docker :** Montage de partitions dédiées sur `/var/lib/docker/volumes` pour les logs, les bases de données (TimescaleDB) et les artefacts de modèles IA.

## 5. Protocoles de Communication
* **Ingestion (Terrain -> Cloud) :** Protocole **MQTT** via un Broker local (ex: Mosquitto) sur VM-MQTT.
* **Inter-services (IA ↔ API ↔ Prod) :** Appels synchrones via **APIs REST** (format JSON).
* **Exposition (Cloud -> Mobile) :** Protocole **HTTPS / REST** sécurisé par certificat TLS.

## 6. Sécurité et Administration (Hardening)
L'architecture suit strictement les principes du **"Moindre Privilège"** et de la **"Défense en Profondeur"**.

### A. Sécurité Système (Host Hardening)
* **Gestion des Utilisateurs :** Interdiction d'utiliser le compte `root`. Création d'utilisateurs dédiés avec des droits restreints.
* **Accès Distant :** 1. Tunnel **VPN sécurisé** obligatoire (Wireguard ou OpenVPN).
    2. Authentification **SSH via clés RSA (4096 bits)** uniquement.
    3. Désactivation totale de l'authentification par mot de passe.
* **Protection Active :** Installation de **Fail2Ban** pour contrer les tentatives de brute-force et déploiement d'un **EDR** (Endpoint Detection and Response) pour la surveillance des processus suspects.

### B. Sécurité Réseau & VNets
* **Périmètre :** Un **Azure Firewall** filtre les flux entrants/sortants (Stateful Inspection).
* **ACLs & NSG :** Mise en place de Listes de Contrôle d