# ⚖️ Méthode MoSCoW

## 🟢 MUST HAVE (Indispensable)
*Ce que le système DOIT faire pour exister.*
* **Détection IA Temps Réel** : Algorithme de reconnaissance de fumée/flammes via les caméras sur pylônes.
* **Alerte < 5 minutes** : Système de notification instantané vers le gestionnaire (SMS/Push).
* **Réseau IoT "Zone Blanche"** : Connectivité LoRaWAN fonctionnelle pour les capteurs au sol.
* **Localisation GPS** : Précision à 50 mètres pour chaque alerte.
* **Infrastructure Critique** : Installation physique des pylônes avec alimentation autonome (solaire).
* **Sécurisation des données** : Chiffrement AES-128 des flux entre les capteurs et le serveur.

## 🔵 SHOULD HAVE (Important)
*Ce qui apporte une grande valeur ajoutée, à faire après les Must.*
* **Analyse de Combustibilité du sol** : Intégration de la couche "Type de sol" (fougères, litière sèche) dans le message d'alerte.
* **Corrélation Satellite** : Utilisation des données infrarouges pour confirmer les "points chauds" détectés au sol.
* **Tableau de bord de gestion** : Interface web permettant de visualiser l'état de santé de tous les capteurs.
* **Levée de doute visuelle** : Possibilité pour le gestionnaire de prendre le contrôle à distance d'une caméra sur pylône.

## 🟡 COULD HAVE (Confort / Bonus)
*Les "petits plus" si le budget et le temps le permettent.*
* **Modèle de propagation prédictif** : Estimation de la direction du feu basée sur la météo en temps réel et le type de bois.
* **Application Mobile dédiée** : Une version native iOS/Android pour les agents sur le terrain (en plus du tableau de bord web).
* **Autodiagnostic matériel** : Système qui alerte si un capteur est recouvert par de la végétation ou déplacé par un animal.

## 🔴 WON'T HAVE (Hors sujet pour l'instant)
*Ce qui est explicitement exclu de cette phase du projet.*
* **Surveillance de la faune** : Comptage des espèces protégées ou invasives (trop gourmand en ressources IA pour l'instant).
* **Lutte active** : Systèmes d'extinction automatique ou largage d'eau par drone.
* **Gestion des inondations/sécheresses** : Nous nous concentrons exclusivement sur le risque incendie comme demandé.
* **Régulation de la chasse** : Surveillance des actions humaines ou du braconnage.
