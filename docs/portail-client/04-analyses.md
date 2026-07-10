# 📊 Analyses — `/account/analytics`

## Ce que voit le client

- **4 KPIs** : missions au total, kilomètres parcourus, dépenses totales, coût moyen/km.
- **4 graphiques** :
  - 📅 missions par mois (6 derniers mois, barres) ;
  - 🎯 répartition par statut (donut avec légende et pourcentages) ;
  - 💸 dépenses par mois en TND (barres) ;
  - 🏆 trajets les plus fréquents (barres horizontales, top 5).

## Comment c'est fait

### Fichiers

| Fichier | Rôle |
|---|---|
| `frontend/frontoffice/app/account/analytics/page.js` | Page : agrégations + mise en page |
| `frontend/frontoffice/components/portal/charts.js` | **Nouveau** — `BarChart`, `DonutChart`, `HBarChart` en SVG pur |

### Graphiques SVG maison — zéro dépendance

Pas de Chart.js / Recharts : les 3 composants dessinent en SVG (≈120 lignes au total),
d'où un bundle léger et un thème parfaitement raccord (couleurs via variables CSS du
portail → **dark mode automatique**).

- `BarChart` : `viewBox="0 0 100 60"` + `preserveAspectRatio="none"` → responsive sans JS ;
- `DonutChart` : arcs `path A r r 0 large 1 x y` calculés par `arcPath()` (conversion
  polaire→cartésien), total au centre, légende avec pourcentages ;
- `HBarChart` : simples `div` proportionnels au max.

### Agrégations (100 % côté client, `useMemo`)

Source unique : `GET /api/missions/my`. Aucune charge backend supplémentaire.

- **6 derniers mois glissants** (`derniersMois()`) : clés `annee-mois` pour ranger
  chaque mission dans son mois ;
- **km parcourus** : Σ `distanceKm` des missions `TERMINEE` ;
- **dépenses** : Σ `coutTotal || coutEstimeAI` des `TERMINEE` ;
- **coût moyen/km** : dépenses ÷ km (0 protégé) ;
- **top trajets** : regroupement par « VilleDépart → VilleArrivée », tri décroissant, top 5.

## Comment tester

1. `/account/analytics` avec un client ayant des missions → KPIs + 4 graphiques remplis.
2. Client sans mission → état vide avec bouton « Réserver un transport ».
3. Basculer le dark mode (🌙 en haut à droite) → les graphiques suivent le thème.
