# Analyses — filtres métier, nouveaux graphiques, mise en page

Page : `/analytics` · Commits `85d43b7`, `01b5df0`

## Ce qui a changé

1. **Un bug de données** vidait silencieusement toute la partie flotte.
2. **Le grand bloc vide** au milieu de la page a disparu.
3. **Des filtres métier** s'appliquent à l'ensemble des analyses.
4. **Cinq graphiques** ont été ajoutés (21 cartes contre 15).
5. Le bouton **« Générer Rapport »** produit un vrai document (commit `01b5df0`).

## 1. Le bug qui vidait la flotte

`vehiculeService.getAll()` lisait `response.data.data`, alors que Fleet.API
renvoie `{ total, page, pageSize, items }`. La liste revenait donc **toujours
vide**, ce qui donnait : disponibilité de la flotte à **0 %**, graphique « État
de la flotte » masqué, consommation par véhicule sans données.

Le service accepte maintenant les trois formes de réponse rencontrées dans le
projet (tableau direct, `items`, `data`). La flotte remonte : « État de la
flotte (13) ».

## 2. Le bloc vide

Les colonnes conditionnelles étaient écrites `<Col>{condition && <Chart/>}</Col>` :
la colonne occupait la grille **même sans contenu**, d'où un vide d'environ
440 px. Elles sont passées en `{condition && <Col><Chart/></Col>}` (flotte,
maintenance, carburant).

Mesuré après correction : **aucun bloc vide** (contre un de 443 px avant).

## 3. Filtres métier

Nouveau composant `AnalyticsFilters` : **client, chauffeur, véhicule, statut,
type de véhicule, destination, période (du/au)**.

Deux principes :

- **Les valeurs proposées sont déduites des données réellement chargées** — on
  ne propose jamais un chauffeur ou une destination qui n'existe dans aucune
  mission (5 clients, 3 chauffeurs, 13 véhicules, 6 types, 13 destinations sur
  le jeu actuel).
- **Les filtres s'appliquent avant tout calcul** : missions, véhicules et
  interventions sont réduits au périmètre demandé, puis tous les indicateurs et
  graphiques sont recalculés. La page raconte donc **une seule histoire
  cohérente**, au lieu de mélanger un graphique filtré et un autre non.

Un badge indique le périmètre courant et un bouton réinitialise.

## 4. Nouveaux graphiques

Section **Performance opérationnelle** :

- **Performance des chauffeurs** — missions réalisées et kilomètres parcourus
- **Performance des véhicules** — idem par immatriculation
- **Missions par client** — répartition de l'activité commerciale
- **Parc par type de véhicule**

Section **Flotte** :

- **Taux d'utilisation du parc** — part des véhicules réellement mobilisés
  (distinct de la disponibilité, qui est un état instantané)

## Fichiers

- `services/vehiculeService.ts` — correction de la lecture de réponse
- `components/dashboard/analytics/useAnalyticsData.ts` — filtres, options,
  application du périmètre, nouveaux agrégats
- `components/dashboard/analytics/AnalyticsFilters.tsx` — nouveau
- `components/dashboard/AnalyticsDashboard.tsx` — mise en page, section
  Performance, branchement des filtres
- `components/dashboard/ChartWidget.tsx` — icône d'en-tête, hauteur homogène
- `components/dashboard/analytics/StatTile.tsx` — accent coloré, puce de tendance
- `components/dashboard/analytics/reportActions.ts` — génération du rapport

## Endpoints

Aucun nouvel endpoint : tout s'appuie sur les services existants (missions,
véhicules, interventions, carburant, clients) et sur des calculs côté client.

## Le rapport (« Générer Rapport »)

Le bouton reproduisait la page imprimée, comme « Exporter PDF ». Il ouvre
désormais un **document dédié** dans un nouvel onglet : couverture XPARK,
synthèse en tuiles, tableaux (missions par statut, top destinations, top
clients, flotte et maintenance), pied de page confidentiel, puis impression.
Le contenu respecte le RBAC : les blocs financiers sont absents hors direction.

## Tester manuellement

1. `/analytics` : vérifier qu'il n'y a **aucun bloc vide** et que « État de la
   flotte » et « Taux d'utilisation du parc » affichent des chiffres.
2. Choisir un statut « TERMINEE » : le badge indique le nombre de missions du
   périmètre et **tous** les graphiques se recalculent (vérifié : 18 → 11).
3. Combiner client + période, puis « Réinitialiser ».
4. « Générer Rapport » : un onglet s'ouvre avec le document et la boîte
   d'impression. (Autoriser les fenêtres pop-up.)

## Limites et suites possibles

- Le filtrage est fait **côté client** : pertinent au volume actuel, à déporter
  vers l'API si le nombre de missions devient important.
- Le filtre « destination » porte sur la ville d'arrivée ; un vrai découpage par
  gouvernorat demanderait un référentiel géographique.
- Les coûts carburant proviennent d'un agrégat mensuel global : ils ne sont pas
  filtrables par véhicule.
