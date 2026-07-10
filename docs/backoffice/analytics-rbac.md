# 📊 Analyses & KPIs — dynamique + RBAC + export — `/analytics`

## Le problème

La page `http://localhost:3000/analytics` mélangeait KPIs réels et **données inventées** :

| Élément | Avant |
|---|---|
| « Performance Financière (6 derniers mois) » | Tableaux codés en dur : `[45200, 52100, 48500…]` |
| « Répartition des Missions » | Donut inventé : `[120, 45, 235, 12]` |
| Contrôle d'accès | **Aucun** — un chauffeur voyait toutes les analyses financières |
| Export / partage | Inexistants |

## Ce qui a été fait

### 1. Système RBAC (`analytics/rbac.ts`)

`permissionsFor(role)` retourne les permissions de la page par rôle :

| Permission | ADMIN / ADMINISTRATEUR / GESTIONNAIRE | TECHNICIEN | CHAUFFEUR |
|---|---|---|---|
| `operations` (missions, volumes, distances — sans montants) | ✅ | ✅ | ✅ |
| `fleet` (état de la flotte) | ✅ | ✅ | ❌ |
| `maintenance` (interventions) | ✅ | ✅ | ❌ |
| `finance` (revenus, coûts, marges — **privé direction**) | ✅ | ❌ | ❌ |
| `fuel` (coûts carburant) | ✅ | ❌ | ❌ |
| `recalculate` (bouton Recalculer les KPIs) | ✅ | ❌ | ❌ |
| `export` (PDF + partage) | ✅ | ❌ | ❌ |

- Les sections non autorisées ne sont **pas rendues du tout** et leurs appels API ne
  partent même pas (le hook ne charge que ce que le rôle peut voir).
- Un bandeau explique aux rôles restreints : « Certaines analyses (finance, coûts)
  sont réservées à la direction ».
- Rappel : les endpoints sensibles restent aussi protégés côté serveur
  (`/api/factures/*` = rôles staff, etc.) — le RBAC front est une couche UX,
  pas la seule barrière.

### 2. Données 100 % réelles (`analytics/useAnalyticsData.ts`)

| Graphique | Source réelle |
|---|---|
| Répartition des missions (donut) | `missionService.getAll()` — comptage par statut |
| Missions par mois + distance totale | idem, agrégé sur 6 mois glissants (libellés FR) |
| Revenus vs coûts (aire, 6 mois) | Revenus = Σ `coutTotal` des missions TERMINEE / mois ; Coûts = évolution mensuelle carburant (`carburantService.getStats`) + coûts interventions (`interventionService.getAll`) |
| État de la flotte (donut) | `vehiculeService.getAll()` — par statut |
| Consommation par véhicule (barres) | `consommationMoyenne` des véhicules |
| Top véhicules coût carburant | `carburantService.getStats().topVehiculesParCout` |
| Évolution mensuelle carburant | `carburantService.getStats().evolutionMensuelle` |
| Interventions par type + coût total | `interventionService.getAll({ pageSize: 500 })` |
| Cartes KPI par catégorie | `kpiService.getParCategorie(...)` (existant, conservé) |

### 3. Export PDF & partage (`analytics/reportActions.ts`) — direction uniquement

- **Exporter PDF** : impression navigateur ciblée sur `#analytics-report`
  (CSS `@media print` : seul le rapport est imprimé, cartes sans ombre,
  saut de page propre). Les graphiques ApexCharts sont en SVG → rendu PDF parfait.
  En-tête imprimé dédié : « XPARK — Rapport de performance », date, auteur, rôle.
- **Partager** : `navigator.share` natif (mobile/Windows) avec repli
  presse-papiers — copie une synthèse texte (KPIs clés + missions terminées +
  distance + lien du rapport) à coller dans un email.
- Zéro dépendance ajoutée (pas de jsPDF/html2canvas).

### 4. Style

Réutilise les briques existantes du thème : `ChartWidget` (wrapper ApexCharts avec
les options par défaut du template — mêmes courbes/lissages que les pages `/charts`),
`KPICard`, palette du template (`#405189`, `#0ab39c`, `#f06548`, `#f7b84b`).

## Fichiers

```
frontend/backoffice/src/components/dashboard/
├── AnalyticsDashboard.tsx          # réécrit — sections RBAC + graphiques réels
└── analytics/
    ├── rbac.ts                     # [nouveau] permissions par rôle
    ├── useAnalyticsData.ts         # [nouveau] chargement + agrégats (6 mois, répartitions)
    └── reportActions.ts            # [nouveau] export PDF, partage, CSS impression
```

## Comment tester

```bash
docker compose build backoffice && docker compose up -d backoffice
```
1. **ADMIN/GESTIONNAIRE** → `/analytics` : 5 sections (opérations, flotte, finance,
   maintenance, carburant) + boutons Recalculer / Exporter PDF / Partager.
2. **CHAUFFEUR** → uniquement « Activité opérationnelle » (aucun montant TND),
   bandeau « réservées à la direction », pas de boutons export/recalcul.
3. **TECHNICIEN** → opérations + flotte + maintenance, pas de finance ni carburant.
4. « Exporter PDF » → boîte d'impression : seul le rapport s'imprime, avec l'en-tête
   XPARK daté. « Partager » → partage natif ou synthèse copiée.
