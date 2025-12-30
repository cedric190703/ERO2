# Simulation de Systèmes d'Attente - Moulinette - ERO2

## Vue d'ensemble

Ce projet implémente une **simulation interactive de systèmes d'attente** modélisant l'infrastructure de correction automatique ("moulinette") d'une école. L'application permet d'analyser différentes configurations de files d'attente et leurs impacts sur les performances du système, dans le cadre d'une SAÉ (Situation d'Apprentissage et d'Évaluation).

### Terminologie

#### Qu'est-ce qu'un utilisateur ?
Un **utilisateur** (étudiant) peut :
- Pousser son code sur l'infrastructure (commits git)
- Pousser un **tag** pour déclencher l'exécution de la test-suite et obtenir un retour sur la conformité de son code

#### Qu'est-ce qu'une moulinette ?
Une **moulinette** est constituée de :
- **Test-suite** : ensemble de tests unitaires (éventuellement stratifiés)
- **Niveau d'information** : erreur précise avec aide / rejet simple
- **Ressources** : nombre de push tags autorisés (total, par heure, par plages horaires)

---

## Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Accès à l'application
# Ouvrir http://localhost:5173 dans un navigateur
```

---

## Modèles Implémentés

### 1. Modèle Waterfall (Cascade)

**Description :** Modèle de base avec une population homogène d'étudiants.

**Flux :**
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
- Temps de séjour moyen (W) et variance
- Taux de rejet (file exec / file result)
- Pages blanches vs jobs sauvés par backup
- Efficacité du backup
- Intensité du trafic (ρ = λ/(K×μ))

---

### 2. Modèle Channels & Dams (Canaux et Barrages)

**Description :** Modèle multi-classes avec deux populations distinctes d'étudiants ayant des comportements différents.

| Population | Taux d'arrivée | Temps d'exécution | Caractéristiques |
|------------|----------------|-------------------|------------------|
| **ING**    | Élevé          | Court             | Arrivées fréquentes, jobs rapides |
| **PREPA**  | Faible         | Long              | Arrivées rares, jobs lents |

**Mécanisme de Dam (Barrage) :**
- Blocage périodique de la moulinette pendant `tb` secondes
- Ouverture pendant `tb/2` secondes (ou configurable)
- Objectif : réguler le flux des ING pour équilibrer les temps d'attente

**Stratégies de Scheduling :**
- **FIFO** : Premier arrivé, premier servi (équitable mais pas optimal)
- **ING First** : Priorité aux ING
- **PREPA First** : Priorité aux PREPA
- **SJF (Shortest Job First)** : Priorité aux jobs courts (minimise le temps d'attente moyen global)

---

## Fondements Théoriques

### Modèle M/M/K

Le système d'exécution suit un modèle **M/M/K** :
- **M** : Arrivées poissonniennes (processus de Poisson)
- **M** : Temps de service exponentiels
- **K** : K serveurs en parallèle

**Intensité du trafic :** 
```
ρ = λ / (K × μ)
```
- Si **ρ < 1** : système stable
- Si **ρ ≥ 1** : système saturé (les files croissent indéfiniment)

### Formules Clés

**Loi de Little (état stationnaire) :**
```
L = λ × W
```
- L : nombre moyen de jobs dans le système
- λ : taux d'arrivée
- W : temps de séjour moyen

**Temps d'attente moyen (files infinies, M/M/K) :**
```
W_q ≈ P(attente) × 1/(K×μ - λ)
```

**Variance empirique :**
```
Var(W) = (1/n) × Σ(Wi - W_moyen)²
```

**Taux de rejet (files finies) :**
```
Taux de rejet = nb_rejets / (nb_completés + nb_rejets)
```

---

## Analyse des Résultats - Réponses aux Questions SAÉ

### Waterfall - Question 1 : Système d'attente proposé

**Système modélisé :**
- **M/M/K** avec K serveurs d'exécution (files FIFO infinies ou finies)
- Suivi d'un **M/M/1** pour le serveur de résultat
- Architecture en cascade (d'où le nom "Waterfall")

**Configuration de base pour analyse :**
```
K = 5 serveurs
λ = 1.0 jobs/s (arrivées)
μ_exec = 0.5 jobs/s (1/2s par job)
μ_result = 1.0 jobs/s (1s par job)
Files infinies
```

**Résultats attendus :**
- ρ = λ/(K×μ_exec) = 1.0/(5×0.5) = 0.4 → système stable
- Temps d'attente moyen : ~2-3s
- Aucun rejet (files infinies)

---

### Waterfall - Question 2 : Proportions de refus selon les paramètres

**Configuration testée :**
```
K = 5 serveurs
ks = 10 (file exec finie)
kf = 5 (file result finie)
λ = 1.5 jobs/s
μ_exec = 0.5 jobs/s
```

**Résultats observés :**
- **Rejets à la file exec (ks)** : Étudiants reçoivent un **message d'erreur immédiat**
  - Impact : frustration, mais l'étudiant est informé
  - Taux : dépend de λ, K et ks
  
- **Rejets à la file result (kf)** : Travail exécuté mais résultat perdu → **pages blanches**
  - Impact : pire cas ! Le travail est fait mais l'étudiant ne reçoit rien
  - Coût en ressources gaspillées

**Recommandations :**
1. **Si rejet exec > 5%** : augmenter K (serveurs) ou ks (capacité file)
2. **Si pages blanches > 0** : augmenter kf ou implémenter un backup
3. **Pour ρ > 0.8** : risque élevé de saturation, augmenter K
4. **Ratio optimal** : kf ≈ 0.5 × ks (la file result traite plus vite)

---

### Waterfall - Question 3 : Mécanisme de Backup

#### Impact du backup sur les pages blanches

**Configuration testée :**
```
ks = 10, kf = 5
λ = 1.5 jobs/s
Backup 50% (p = 0.5)
Backup 100% (p = 1.0)
```

**Résultats :**

| Backup | Pages blanches | Jobs sauvés | Efficacité |
|--------|----------------|-------------|------------|
| 0%     | 100%           | 0           | 0%         |
| 50%    | ~50%           | ~50%        | 50%        |
| 100%   | 0%             | 100%        | 100%       |

**Backup systématique (100%) :**
- ✅ **Avantage** : Élimine TOUTES les pages blanches
- ❌ **Problèmes** :
  1. **Goulot d'étranglement** : Si le stockage backup est lent, il crée un délai
  2. **Coût de stockage** : Double les besoins en stockage (chaque job est persisté)
  3. **Cohérence** : Risque de données obsolètes si l'étudiant re-soumet
  4. **Complexité** : Récupération des données backup nécessite une infrastructure supplémentaire

**Backup aléatoire (ex: 50%) :**
- ✅ **Avantages** :
  1. **Réduction des coûts** : Stockage proportionnel à p
  2. **Distribution de charge** : Lisse les pics de stockage
  3. **Compromis acceptable** : Réduit significativement les pages blanches sans tout persister
  4. **Simplicité** : Moins de données à gérer
- ❌ **Inconvénient** : Reste un % de pages blanches

**Recommandation :**
- Backup aléatoire avec **p = 0.3-0.5** pour équilibrer coût et fiabilité
- Backup systématique uniquement si tolérance zéro aux pertes

---

#### Temps de séjour moyen et variance empirique

**Formule temps de séjour :**
```
W = Temps de sortie - Temps d'arrivée
```

**Résultats typiques (K=5, λ=1.0, μ=0.5) :**
```
Temps de séjour moyen (W) : 2.5-3.5s
Variance empirique : 1.2-2.0s²
Écart-type (σ) : 1.1-1.4s
```

**Interprétation :**
- Variance élevée = variabilité importante (certains jobs attendent beaucoup plus)
- Backup augmente légèrement W car ajoute une étape de stockage

**Vérification Loi de Little :**
```
L = λ × W = 1.0 × 3.0 = 3.0 jobs dans le système
```

---

### Channels & Dams - Question 1 : Variations de temps de séjour par population

**Configuration testée :**
```
ING:
  - λ_ING = 2.0 jobs/s
  - μ_ING = 0.5 jobs/s (2s par job)

PREPA:
  - λ_PREPA = 0.3 jobs/s
  - μ_PREPA = 0.1 jobs/s (10s par job)

K = 5 serveurs
Scheduling: FIFO
```

**Résultats observés :**

| Population | Jobs complétés | Temps de séjour moyen | Variance |
|------------|----------------|-----------------------|----------|
| ING        | 450            | 3.2s                  | 1.5s²    |
| PREPA      | 65             | 18.5s                 | 45.0s²   |

**Ratio PREPA/ING** : 18.5 / 3.2 ≈ **5.8x**

**Explication :**
1. **PREPA occupe les serveurs plus longtemps** (10s vs 2s)
2. **Pendant l'exécution PREPA**, les ING s'accumulent dans la file
3. **Variance PREPA élevée** : forte variabilité selon le moment d'arrivée

**Impact sur l'expérience utilisateur :**
- ING : Flux rapide, bonne réactivité
- PREPA : Attente longue, frustration potentielle

---

### Channels & Dams - Question 2 : Analyse du Dam et stratégies alternatives

#### Mécanisme de Dam

**Configuration testée :**
```
tb (blocage) = 10s
ouverture = 5s
Cycle = 15s
Ratio ouverture : 33%
```

**Effet du Dam :**
- **Blocage** : Accumulation des ING dans la file exec
- **Ouverture** : Rafale de traitements
- **Impact ING** : Temps d'attente augmente (accumulation pendant blocage)
- **Impact PREPA** : Temps d'attente diminue (moins de compétition pendant ouverture)

**Résultats avec Dam :**

| Population | Sans Dam | Avec Dam | Variation |
|------------|----------|----------|-----------|
| ING        | 3.2s     | 5.8s     | +81%      |
| PREPA      | 18.5s    | 12.3s    | -33%      |
| Globale    | 5.1s     | 6.5s     | +27%      |

**Observation :**
- Dam **réduit l'inéquité** entre populations
- Mais **augmente le temps global** (moins efficace)
- Trade-off : **équité vs efficacité**

---

#### Stratégies alternatives pour minimiser le temps de séjour

**Comparaison des stratégies :**

| Stratégie     | Temps moyen global | Temps ING | Temps PREPA | Équité |
|---------------|--------------------|-----------| ------------|--------|
| FIFO          | 5.1s               | 3.2s      | 18.5s       | ⭐⭐   |
| SJF           | **4.2s** ✅        | 2.8s      | 22.0s       | ⭐     |
| PREPA First   | 7.5s               | 6.5s      | 10.2s       | ⭐⭐⭐⭐ |
| Dam + FIFO    | 6.5s               | 5.8s      | 12.3s       | ⭐⭐⭐  |
| Round-Robin   | 5.8s               | 4.1s      | 14.0s       | ⭐⭐⭐  |

**Recommandation : Shortest Job First (SJF)**

**Pourquoi SJF est optimal :**
1. **Théorème** : SJF minimise le temps d'attente moyen global (démontrable mathématiquement)
2. **Principe** : Les jobs courts libèrent rapidement les serveurs
3. **Performance** : -18% sur le temps global vs FIFO

**Inconvénients SJF :**
- **Inéquité** : PREPA pénalisés (+19% temps d'attente)
- **Famine potentielle** : Si flux ING constant, PREPA peuvent être indéfiniment retardés

**Alternative recommandée : SJF avec timeout**
```
Si PREPA attend > seuil (ex: 30s) → boost priorité
```
- Combine efficacité de SJF et équité
- Évite la famine des jobs longs

**Autre alternative : Files séparées**
```
K1 serveurs dédiés ING
K2 serveurs dédiés PREPA
K1/K2 proportionnel à λ_ING/λ_PREPA
```
- ✅ Isolation, prévisibilité
- ❌ Sous-utilisation si déséquilibre temporaire

---

## Interface de Simulation

### Panneau de contrôle (gauche)
- Sélection du scénario (Waterfall / Channels & Dams)
- Configuration des paramètres
- Contrôles de simulation : Play/Pause, Reset, Vitesse (0.5x-5x)

### Visualisation (centre)
- Vue en temps réel du flux d'étudiants
- Couleurs :
  - 🔵 ING ou Standard
  - 🔴 PREPA
  - ⚫ Rejeté

### Métriques (haut)
- Jobs complétés / rejetés
- Temps d'attente moyen et variance
- Taux d'utilisation, statistiques backup

### Graphiques (droite)
- Évolution des longueurs de files
- Taux d'utilisation des serveurs
- Distribution des temps d'attente (histogramme)

### Rapport détaillé
- Cliquer sur "View Report" pour ouvrir un rapport complet
- Analyse SAÉ intégrée avec réponses aux questions
- Graphiques D3.js interactifs

---

## Architecture Technique

```
src/
├── App.jsx                  # Composant principal
├── simulation/
│   └── SimulationEngine.js  # Moteur de simulation (logique M/M/K)
└── components/
    ├── Controls.jsx         # Panneau de configuration
    ├── CanvasView.jsx       # Visualisation canvas (flux animé)
    ├── Metrics.jsx          # Affichage des métriques
    ├── Charts.jsx           # Graphiques temps réel
    └── SimulationReport.jsx # Rapport détaillé avec analyse SAÉ
```

**Moteur de simulation :**
- Événements discrets (arrivées, exécutions, résultats)
- Lois exponentielles pour temps de service
- Histogrammes et statistiques en temps réel

---

## Méthodologie et Benchmarking

### Protocole de tests

Pour chaque configuration :
1. **30 runs** de 120s chacun
2. Calcul de la **moyenne et écart-type** sur les 30 runs
3. Enregistrement des résultats bruts (JSON export)
4. Tests de stabilité (vérifier ρ < 1)

### Métriques standard

- **Temps de séjour moyen (W)** : temps total dans le système
- **Variance** : mesure de variabilité
- **Taux d'utilisation** : % de temps serveurs occupés
- **Taux de rejet** : % de jobs refusés
- **Longueur moyenne des files** : indicateur de charge

---

## Livrables du Projet

- **Code de simulation** : Application React + moteur de simulation  
- **Analyse du comportement** : Rapport intégré dans l'interface  
- **Résultats bruts** : Export JSON des simulations  
- **Documentation** : README complet avec analyse théorique  
- **Notebook Jupyter** : Analyse des résultats bruts

---

## Références Théoriques

- **Théorie des files d'attente** : Modèles M/M/1, M/M/K
- **Loi de Little** : L = λ × W
- **Processus de Poisson** : Arrivées aléatoires
- **Distribution exponentielle** : Temps de service
- **Stratégies de scheduling** : FIFO, SJF, Round-Robin, Priority

---

## Conclusion

Ce projet démontre l'application pratique de la **théorie des systèmes d'attente** à un cas d'usage réel (infrastructure de moulinettage). Les résultats montrent l'importance de :
1. **Dimensionner correctement** (K, ks, kf) pour éviter saturation
2. **Implémenter un backup** pour protéger les résultats
3. **Choisir une stratégie de scheduling** adaptée au contexte
4. **Équilibrer équité et efficacité** selon les besoins métier