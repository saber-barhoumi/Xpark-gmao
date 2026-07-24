# Guide développeur — pages front-office dynamiques

Public : développeur reprenant ces pages. Contexte :
`frontend/backoffice` (React 18 + Vite + TypeScript + React-Bootstrap +
ApexCharts, routage `react-router-dom`, HTTP via `@/lib/axiosConfig`).

## 1. Le patron « service → orchestrateur → présentation »

Toutes les pages converties suivent le même patron :

```
services/<x>Service.ts     ← modèle typé + accès données (mock ou API) + dérivés
app/(admin)/<page>/page.tsx← orchestrateur : charge, tient l'état, filtre
       └─ components/*      ← composants de présentation pilotés par props
```

- **Le service** définit les interfaces/enums, expose des méthodes async
  (`getAll`, `getById`) et des calculs dérivés (`computeStats`,
  `computeFolders`, `computeStorage`).
- **L'orchestrateur** (`page.tsx`) gère `loading` / `error` / `data`, les
  filtres, le tri et la pagination via `useState` + `useMemo`.
- **Les composants** ne font que recevoir des props et émettre des callbacks
  (`onView`, `onDelete`, `onToggleStar`…). Ils sont réutilisables et testables.

## 2. Où se trouvent les modèles de données

| Page | Service | Types clés |
|---|---|---|
| Carburant | `services/carburantService.ts` (existant) | `Carburant`, `CarburantStats` |
| Projets | `services/projectService.ts` | `Project`, `ProjectStatus`, `ProjectStats` |
| Fichiers | `services/fileService.ts` | `ManagedFile`, `FileKind`, `FileFolder`, `StorageInfo` |
| Trésorerie | `services/walletService.ts` | `Transaction`, `TxCategory`, `WalletStats` |
| FAQ | `app/(admin)/pages/faq/data.ts` | `FaqCategory`, `FaqItem` |

## 3. Brancher une vraie API

Chaque service mock isole **un seul point de bascule**. Exemple (Projets) :

```ts
// AVANT (mock)
async getAll(): Promise<Project[]> {
  await wait(500)
  return structuredClone(MOCK_PROJECTS)
}

// APRÈS (API réelle)
import api from '@/lib/axiosConfig'
async getAll(): Promise<Project[]> {
  const { data } = await api.get('/projets')
  return data
}
```

Rien d'autre ne change : la page, les états et les composants restent
identiques tant que la forme renvoyée respecte l'interface. Si le backend
diffère, adapter la **projection** dans le service (mapper la réponse vers
l'interface), pas les composants.

Pour Carburant, la bascule est **déjà faite** : la page consomme les vraies
API Fleet (`/carburants`, `/carburants/stats`).

## 4. Recettes courantes

- **Ajouter un filtre** : ajouter un `useState`, l'inclure dans le `useMemo`
  de filtrage, et le remettre à zéro dans le `resetFiltres`.
- **Ajouter une colonne triable** (carburant) : étendre l'union `SortCol`,
  ajouter un cas dans la fonction `val()`, poser un `<SortHeader col=… />`.
- **Ajouter un KPI** : ajouter le champ dans `computeStats()` du service puis
  une carte dans le composant d'aperçu.
- **États** : toujours prévoir `loading` (spinner), `error` (message +
  Réessayer) et `empty` (message + action de sortie). Voir n'importe quel
  `page.tsx` converti comme référence.

## 5. Conventions de style à respecter

- Composants **fonctionnels** + hooks ; pas de logique métier dans le JSX.
- Couleurs via les variantes Bootstrap (`primary`, `success`, `bg-soft-*`),
  jamais de couleur en dur hors config ApexCharts.
- Icônes via `IconifyIcon` (`ri:*` ou `tabler:*`).
- Montants : `toLocaleString('fr-FR')` + unité (`TND`, `L`, `km`).
- Un dossier `components/` par page ; le `page.tsx` orchestre.

## 6. Vérifier avant de committer

```bash
cd frontend/backoffice
npx tsc --noEmit -p tsconfig.json   # 0 erreur
npx vite build                       # build OK
```

Puis rebuild du conteneur si besoin de tester dans le navigateur :
`docker compose build backoffice && docker compose up -d backoffice`.
