# 📋 Feuille de Cadrage : Projet "Silvanus Guard"

**Titre du projet :** Protection et prévention d’une parcelle forestière  
**Date :** 27/04/2026  
**Rédigé par :** Edouard Courault, Teddy Barraud & Hugo Meuriel

---

## 1. Contexte & Problématique (QQOQCP)
* **Qui :** Gestionnaires de parcs forestiers publics (ex: ONF).
* **Quoi :** Risques liés au changement climatique (sécheresse, incendie, inondation).
* **Où :** Territoire français.
* **Quand :** Surveillance continue 24/7, modulation selon la saisonnalité géographique.
* **Comment :** Déploiement de capteurs environnementaux (thermique, humidité air/sol, fumée) et traitement des données en temps réel via une architecture Cloud/IA.
* **Pourquoi :** Améliorer la réactivité face aux catastrophes. Passer d'une surveillance globale imprécise à un ciblage d'alerte sur une zone de **1 km²** pour un risque identifié dans un périmètre de **10 km**.

## 2. Objectifs SMART
* **Objectif 1 :** Anticiper et détecter les départs d'incendies via l'analyse du taux de fumée et de chaleur.
* **Objectif 2 :** Alerter en temps réel lors de crues subites pour prévenir les inondations.
* **Objectif 3 :** Monitorer le stress hydrique des sols pour prévenir les périodes de sécheresse intensive.

## 3. Périmètre
* **Dans le projet :** Monitoring des risques environnementaux majeurs (feu, eau, sécheresse).
* **Hors projet :** Suivi de la biodiversité (faune/flore), gestion des dégradations humaines (vandalisme, coupes illégales).

## 4. Parties Prenantes
* **Maître d'ouvrage :** État Français (Ministère de la Transition Écologique).
* **Exploitants :** Gardes forestiers et services d'urgence.

## 5. Ressources Prévisionnelles
* **Budget :** 234 960 €
* **Durée :** 6 à 8 mois
* **Équipe Projet (3 collaborateurs) :**
    * Profil 1 : Développeur + DevOps.
    * Profil 2 : Administrateur Systèmes + Expert Cybersécurité.
    * Profil 3 : Product Owner + Administrateur Systèmes & Sécurité.
    

## 6. Analyse des Risques & Actions Préventives

| Risque | Probabilité (1-10) | Impact (1-10) | Action Préventive |
| :--- | :---: | :---: | :--- |
| **Dégradation matérielle** (Météo, faune) | 7 | 10 | Renforcement physique des boîtiers (norme IP67/68). |
| **Perte de données** (Réseau) | 6 | 8 | Optimisation de la couverture (LoRaWAN/Antennes relais) et mise en cache locale. |
| **Cyberattaques** (MitM, altération) | 2 | 8 | Chiffrement de bout en bout, clés RSA 4096, VPN et authentification forte. |

## 7. Roadmap & Évolutions (Prochaines Étapes)
* Intégration de l'imagerie satellite pour corréler les données terrain.
* Module de détection des espèces invasives via IA sonore ou visuelle.
* Suivi des populations d'espèces protégées.