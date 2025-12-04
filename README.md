# Simulation de Systèmes d'Attente - Moulinette

## 📋 Vue d'ensemble

Ce projet implémente une simulation interactive de systèmes d'attente modélisant l'infrastructure de correction automatique "moulinette" d'une école. L'application permet d'analyser différentes configurations de files d'attente et leurs impacts sur les performances du système.

## 🎯 Contexte (SAÉ)

La moulinette est une infrastructure de correction automatique qui exécute des tests unitaires sur le code soumis par les étudiants. Ce projet modélise cette infrastructure comme un système d'attente avec :
- **K serveurs d'exécution** : exécutent les tests
- **1 serveur de résultat** : renvoie les résultats aux étudiants
- **Files d'attente FIFO** : gèrent l'ordre des demandes

## 🚀 Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Accès à l'application
# Ouvrir http://localhost:5173 dans un navigateur
```

## 📊 Scénarios Implémentés

### 1. Waterfall (Cascade)

Modèle de base avec une population homogène :

```
Source → [File Exec (ks)] → [K Serveurs Exec] → [File Result (kf)] → [Serveur Result] → Sortie
```

**Paramètres configurables :**
- `K` : nombre de serveurs d'exécution (1-20)
- `ks` : capacité de la file d'exécution (fini ou infini)
- `kf` : capacité de la file de résultats (fini ou infini)
- `λ` : taux d'arrivée (jobs/s)
- `μ_exec` : temps moyen d'exécution (s)
- `μ_result` : temps moyen de traitement des résultats (s)
- `p_backup` : probabilité de sauvegarde de backup (0-1)

**Métriques analysées :**
- Taux de rejet (file exec / file result)
- Temps d'attente moyen et variance
- Pages blanches vs jobs sauvés par backup
- Efficacité du backup

### 2. Channels & Dams (Canaux et Barrages)

Modèle avec deux populations distinctes :

| Population | Caractéristiques |
|------------|------------------|
| **ING** | Arrivées fréquentes, temps d'exécution courts |
| **PREPA** | Arrivées rares, temps d'exécution longs |

**Mécanisme de Dam (Barrage) :**
- Blocage périodique de la moulinette pendant `tb` secondes
- Ouverture pendant `tb/2` secondes
- Permet de réguler le flux des ING

**Stratégies de Scheduling :**
- **FIFO** : Premier arrivé, premier servi
- **ING First** : Priorité aux ING
- **PREPA First** : Priorité aux PREPA
- **SJF (Shortest Job First)** : Priorité aux jobs courts (minimise le temps d'attente moyen)

## 🧮 Fondements Théoriques

### Modèle M/M/K

Le système d'exécution suit un modèle M/M/K :
- Arrivées poissonniennes (M)
- Temps de service exponentiels (M)
- K serveurs en parallèle

**Intensité du trafic :** `ρ = λ / (K × μ)`

### Formules Clés

**Temps d'attente moyen (files infinies) :**
```
W_q = P(attente) × (1 / (K×μ - λ))
```

**Variance empirique :**
```
Var(W) = (1/n) × Σ(Wi - W_moyen)²
```

**Taux de rejet (files finies) :**
```
Rejet = nb_rejets / (nb_completés + nb_rejets)
```

## 📈 Guide d'Analyse

### Question 1 : Comportement du système Waterfall

1. **Configuration de base** : K=5, λ=1, μ_exec=2, μ_result=1, files infinies
2. Observer le temps d'attente moyen qui se stabilise
3. Augmenter λ progressivement et observer la saturation (ρ → 1)

### Question 2 : Files finies (ks, kf)

1. Activer les capacités finies : ks=10, kf=5
2. Observer les rejets à l'exécution vs aux résultats
3. **Constat** : les rejets résultats causent des "pages blanches" (travail perdu)

### Question 3 : Mécanisme de Backup

1. Avec kf fini, activer le backup (p=0.5 puis p=1.0)
2. **Backup 100%** : élimine les pages blanches mais peut causer des goulots
3. **Backup aléatoire** : compromis entre fiabilité et performance
4. Observer l'efficacité du backup dans les métriques

### Question 4 : Variations par population (Channels)

1. Passer en mode "Channels & Dams"
2. Observer les temps d'attente par population
3. Les PREPA ont des temps plus longs car ils occupent les serveurs plus longtemps

### Question 5 : Dam et stratégies alternatives

1. Activer le Dam : observe l'impact sur les ING
2. Tester différentes stratégies de scheduling
3. **SJF** minimise le temps d'attente global mais défavorise les PREPA
4. **PREPA First** équilibre les temps mais augmente le temps global

## 🎨 Interface

### Panneau de contrôle (gauche)
- Sélection du scénario
- Configuration des paramètres
- Contrôles de simulation (Play/Pause, Reset, Vitesse)

### Visualisation (centre)
- Vue en temps réel du flux
- Couleurs des étudiants : 
  - 🔵 ING/Standard
  - 🔴 PREPA
  - ⚫ Rejeté

### Métriques (haut)
- Jobs complétés/rejetés
- Temps d'attente moyen et variance
- Statistiques de backup

### Graphiques (droite)
- Évolution des files d'attente
- Taux d'utilisation des serveurs

## 🔧 Architecture Technique

```
src/
├── App.jsx                 # Composant principal
├── simulation/
│   └── SimulationEngine.js # Moteur de simulation
└── components/
    ├── Controls.jsx        # Panneau de configuration
    ├── CanvasView.jsx      # Visualisation canvas
    ├── Metrics.jsx         # Affichage des métriques
    └── Charts.jsx          # Graphiques temps réel
```

## 📚 Références

- Théorie des files d'attente (M/M/K, M/M/1)
- Loi de Little : L = λ × W
- Processus de Poisson et distributions exponentielles
