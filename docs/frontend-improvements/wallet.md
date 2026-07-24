# Portefeuille / Trésorerie — `/wallet`

## Avant

- Assemblage de **8 composants de template** (`State`, `State2`, `State3`,
  `Count`, `Team`, `Profile`, `Progress`, `Reminders`) avec données codées en
  dur (« Total Orders 687.3k », avatars et rôles fictifs).
- Aucun rapport avec la finance d'une société de transport.
- Pas de solde, pas de transactions, pas de filtres.

## Après

Un **tableau de bord de trésorerie** métier :

- **Couche service** `src/services/walletService.ts` : `Transaction` typé,
  `TxCategory` (facture, carburant, maintenance, assurance, salaires, autre)
  avec icône+couleur, `getWallet()` async, `computeStats()` (entrées, sorties,
  net, en attente, dépenses par catégorie). Mock XPARK (factures encaissées en
  entrée, charges d'exploitation en sortie).
- **Vue d'ensemble** (`WalletOverview.tsx`) : carte de **solde** + KPIs
  entrées / sorties / flux net / en attente.
- **Graphes** (`WalletCharts.tsx`) : flux de trésorerie mensuel (barres) +
  dépenses par catégorie (donut).
- **Historique** (`Transactions.tsx`) : table avec recherche, filtre
  flux + catégorie, statut, montant coloré (+/−), pagination, empty state.
- **Orchestrateur** (`page.tsx`) : loading / error (Réessayer).

## Explication technique

- **Fichiers** : `page.tsx` + `components/WalletOverview.tsx` /
  `WalletCharts.tsx` / `Transactions.tsx`. Les 8 composants de template et
  `data.ts` **supprimés**.
- **Flux** : `page` charge `walletService.getWallet()` → `computeStats()`
  (memo) → distribue `data` + `stats` aux 3 composants. `Transactions` gère
  ses propres filtres/pagination en interne.
- **Design conservé** : cartes, badges `soft-*`, ApexCharts, dégradé de la
  carte de solde cohérent avec le reste.

## Intégration backend future

`getWallet()` peut agréger **Finance** (factures payées → entrées), **Fleet**
(carburant → sorties) et **Maintenance** (coûts → sorties). `computeStats()`
reste réutilisable tel quel.
