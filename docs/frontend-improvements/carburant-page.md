# Page Carburant — `/operations/carburant`

## Avant

Le tableau de bord carburant existait déjà (KPIs, quelques graphes, table,
modal OCR) mais restait limité :

- Aucun **filtre** : impossible de restreindre par véhicule, type ou période.
- Table minimale (date, véhicule, quantité, total, km, source) sans **prix au
  litre** ni **taux de consommation**, sans recherche, tri ni pagination.
- Pas d'**export**.
- KPIs partiels (4) : pas de nombre de pleins, de prix moyen au litre ni de
  véhicule le plus consommateur.
- Une jauge affichait `undefined L` avant chargement des stats.

## Après

Un véritable **« Fleet Fuel Analytics Dashboard »** :

- **Barre de filtres** : véhicule et plage de dates (poussés au backend via
  `getStats({ vehiculeId, start, end })`), type de carburant et recherche
  (côté client), bouton de réinitialisation contextuel.
- **6 KPIs** : consommation moyenne (jauge), coût total, volume, distance,
  nombre de pleins, prix moyen/L, top consommateur.
- **3 graphes** avec états vides dédiés : tendance mensuelle (aire),
  répartition par **type de carburant** (donut, nouveau), top 5 véhicules
  (barres), répartition par source (donut).
- **Table enrichie** : colonnes Type, **Prix/L**, **Taux de consommation**
  (badge vert/orange/rouge selon seuils), recherche, **tri par colonne**,
  **pagination** (10/page), empty states distincts (« aucun plein » vs
  « aucun résultat »).
- **Export CSV** (séparateur `;` + BOM UTF-8) et **PDF** (impression
  navigateur) de la sélection filtrée.

## Explication technique

- **Fichier** : `src/app/(admin)/operations/carburant/page.tsx`.
- **Service réutilisé** : `src/services/carburantService.ts` (inchangé) —
  `getAll(vehiculeId?)`, `getStats({ vehiculeId, start, end })`, `create`,
  `delete`. Aucune API ajoutée : les filtres serveur exploitent des
  paramètres déjà supportés.
- **État** : filtres (`fltVehicule`, `fltType`, `fltStart`, `fltEnd`,
  `search`), tri (`sortKey`, `sortDir`), pagination (`page`). Un `useEffect`
  recharge quand un filtre **serveur** change ; le reste est dérivé via
  `useMemo` (`recordsFiltres`, `repartitionType`).
- **Composants réutilisés** : `PageBreadcrumb`, `IconifyIcon`,
  `BulkDeleteButtons`, `OCRUploadZone`, `ReactApexChart`, et les helpers
  locaux `EmptyChart` / `SortHeader`.
- **Export** : fonctions `exportCsv` / `exportPdf` au niveau module, même
  convention zéro-dépendance que `demandes-transport`.
- **Préservation** : la modal de saisie, l'OCR, le calcul quantité/prix/total,
  le contrôle du kilométrage et le bulk-delete sont **inchangés**.

## Intégration backend future

Rien à faire : la page consomme déjà les vraies API Fleet
(`/carburants`, `/carburants/stats`). Pour affiner la répartition par type
côté serveur, ajouter le détail par type dans `CarburantStats` et l'utiliser
à la place du calcul client `repartitionType`.
