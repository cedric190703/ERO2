# ERO2: Simulation Moulinette

## Description du Projet

Ce projet a été réalisé dans le cadre de la SAÉ ERO2 (ING3 2026). Il consiste en le développement d'un simulateur interactif d'infrastructure de correction automatique ("moulinette") basé sur la théorie des files d'attente (modèle M/M/K).

L'objectif est d'analyser le comportement de systèmes complexes sous charge, d'étudier l'impact des files finies, des mécanismes de backup, et de comparer différentes stratégies d'ordonnancement dans un contexte multi-populations.

## Auteurs (Groupe Tu-tu-tu-du)

- Cédric Brzyski
- Tom Coulliaud-Maisonneuve
- Matthias Laithier
- Thomas Maurer
- Lucas Tilly
- Aziz Zeghal

## Installation et Lancement

Le projet est une application web développée avec React et Vite.

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

## Fonctionnalités Principales

### 1. Moteur de Simulation
Le cœur de l'application est un moteur à événements discrets simulant un système M/M/K.
- Génération d'arrivées (Loi de Poisson).
- Temps de service exponentiels.
- Gestion de files d'attente finies ou infinies.

### 2. Modèles Implémentés
- **Modèle Waterfall** : Deux stations en série (Exécution -> Résultat). Permet d'étudier les goulots d'étranglement et la perte de paquets (rejets ou pages blanches).
- **Modèle Channels & Dams** : Simulation avec deux populations (ING et PREPA) aux caractéristiques différentes. Permet de tester des stratégies de régulation (Dam) et d'ordonnancement.

### 3. Visualisation et Analyse
- Interface graphique temps réel.
- Graphiques dynamiques (longueur des files, utilisation serveurs).
- Rapport d'analyse intégré.

## Synthèse des Résultats

Les simulations réalisées ont permis de dégager plusieurs conclusions majeures (détails disponibles dans le fichier `rapport.pdf`).

### Stabilité et Dimensionnement
La condition de stabilité théorique (rho < 1) est vérifiée. Pour maintenir une fluidité acceptable et absorber les variations de charge, nous recommandons une intensité de trafic cible inférieure à 0.8.

### Gestion des Pertes (Waterfall)
L'utilisation de files finies introduit des risques de rejets. Les rejets en fin de chaîne ("pages blanches") sont particulièrement critiques. Nos simulations montrent qu'un mécanisme de backup est indispensable pour assurer la fiabilité du service, un taux de backup de 50% réduisant déjà significativement les pertes.

### Équité vs Efficacité (Channels & Dams)
La comparaison des algorithmes d'ordonnancement révèle un compromis inévitable :
- **SJF (Shortest Job First)** optimise le temps d'attente moyen global mais crée une forte inéquité pour les tâches longues (PREPA).
- **FIFO** assure l'équité mais est moins performant globalement.
- Le mécanisme de **Dam** (barrage) s'est révélé contre-productif pour l'optimisation des flux dans notre configuration.

Pour une analyse détaillée des métriques et des preuves théoriques, veuillez consulter le rapport complet inclus dans ce dépôt.