# 🏗️ Dossier d'Architecture Technique (DAT) - Réseaux / Cloud

## 1. Vue d'Ensemble
L'infrastructure est déployée sur le cloud **Microsoft Azure** selon une topologie segmentée. L'objectif est d'isoler les environnements de calcul, de données et d'intelligence artificielle afin de garantir une sécurité maximale et une gestion granulaire des flux. L'ensemble des services applicatifs est conteneurisé sous **Docker**, déployé sur des instances **Debian CLI/Linux**.

## 2. Infrastructure Réseau (Networking)
La segmentation est assurée par la création d'**1 Virtual Network (VNet)** ainsi que **6 subnets** :
**VNet_forest_protector**
* **AzureFirewallSubnet** -> Sert de firewall au réseau
* **GatewaySubnet** -> Sert de gateway au réseau
* **AzureBastionSubnet** -> Sert pour le bastion (vu que les VMs n’ont pas d’IP publique)
* **ProdSubnet** -> Sert à isoler la VM de prod des autres VMs
* **MqttSubnet** -> Sert à isoler la VM MQTT et la base de données des autres VMs
* **ApiSubnet** -> Sert à isoler la VM API et IA des autres VMs
* **PasserelleVPNForest** -> Sert de VPN pour les différentes communications des Subnets. Permet aux VMs de communiquer entre elles, et de se connecter au réseau depuis son PC via ce VPN pour ensuite accéder en SSH aux VMs.

## 3. Instances de Calcul (Compute)
L'architecture repose sur **3 Machines Virtuelles (VM)** sous distribution Debian. Le choix de Debian assure stabilité, légèreté et une gestion fine de la sécurité système.

| VM | Rôle | OS / Runtime |
| :--- | :--- | :--- |
| **Vm-Prod** | Orchestration et logique métier | Debian + Docker |
| **Vm-Mqtt** | Broker MQTT, simulation de capteurs et Base de données | Debian + Docker |
| **Vm-Api** | Passerelle Backend (FastAPI/Node.js) et IA | Debian + Docker |

## 4. Stockage et Persistance
Chaque VM dispose d'un **Disk indépendant de 128Go** en Standard SSD LRS pour assurer la persistance des données containers :
* **Volumes Docker** : Montage de partitions dédiées sur `/var/lib/docker/volumes` pour le stockage des logs, des bases de données et des modèles IA.

## 5. Protocoles de Communication
* **Ingestion (`Vm-Mqtt` -> `Vm-Prod`)** : Protocole MQTT via un Broker local sur Vm-Mqtt, pour la réception des données des capteurs sur le serveur de prod.
* **Inter-services (`Vm-Api` <-> `Vm-Prod`)** : Appels synchrones via APIs REST (format JSON), pour récupérer les datas des APIs et de l’IA.
* **Interprétation data (`Vm-Mqtt` -> `Vm-Api`)** : Protocole MQTT pour l’analyse des données des capteurs et de la météo traitées par l’IA pour faire des analyses et prédire les incidents.
* **Exposition (`Vm-Prod` -> `Mobile`)** : Protocole HTTPS / REST sécurisé par TLS, pour avoir accès à l’application.

## 6. Sécurité et Administration
L'architecture suit les principes du **"Moindre Privilège"** :
* **Périmètre** : Un **Azure Firewall** est positionné en entrée/sortie de l'infrastructure pour le filtrage de paquets et la détection d'intrusions (IDS/IPS).
* **Accès Distant** : 
  1. Établissement obligatoire d'un tunnel VPN sécurisé (OpenVPN).
  2. Authentification SSH via clés RSA (4096 bits) uniquement. L'accès par mot de passe est désactivé sur toutes les instances Debian.
* **Isolation Applicative** : Utilisation de réseaux de pont (Bridge) Docker isolés sur chaque VM pour limiter les communications entre containers au strict nécessaire.
* **Sécurisation de la VM** : Créer des utilisateurs avec des droits de “moindre privilège” (ne pas utiliser le `root`).

### Sécurité VPCs
* Créer des Users et ne pas utiliser le root
* Créer les ACLs
* Mettre en place un IPS, Fail2Ban, EDR
