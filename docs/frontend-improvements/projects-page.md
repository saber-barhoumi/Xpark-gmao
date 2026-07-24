# Page Projets — `/apps/Projects`

## Avant

- Données **codées en dur** dans `data.ts` (6 projets « New Admin Design »,
  « Portfolio Website »… sans rapport avec XPARK).
- Barre de filtres (`Head.tsx`) : `<select>` Phase / Sort et champ de
  recherche **sans aucun gestionnaire** → décoratifs.
- Pagination **factice** (« Showing 6 of 52 », liens `href="#"`).
- Aucun état de chargement/erreur/vide, aucune vue de détail.

## Après

- **Couche service** `src/services/projectService.ts` : enum `ProjectStatus`
  (FR) + mapping couleur, interfaces `Project` / `TeamMember` / `ProjectStats`,
  `getAll()` et `getById()` asynchrones (latence simulée), `computeStats()`.
  Données mock aux couleurs XPARK (GPS temps réel, maintenance prédictive,
  migration Clean Architecture, app chauffeur, Ayshaa…).
- **Page dynamique** : chargement async, états **loading / error (Réessayer) /
  empty**, filtres statut + recherche + tri **réellement câblés**, pagination
  fonctionnelle (6/page).
- **Bandeau statistiques** (`ProjectStats.tsx`) : total, actifs, terminés,
  en retard, avancement moyen.
- **Fiche détail** (`ProjectDetails.tsx`) : modal avec dates, tâches, budget,
  équipe.

## Explication technique

- **Fichiers** : `page.tsx` (orchestrateur), `components/Head.tsx` (barre
  contrôlée), `components/Projects.tsx` (grille pilotée par props),
  `components/ProjectStats.tsx`, `components/ProjectDetails.tsx`.
  `data.ts` **supprimé**.
- **Flux de données** : `page` charge via `projectService.getAll()` →
  `useMemo` applique statut + recherche + tri → pagination locale → `Projects`
  affiche la page courante ; `onView` ouvre `ProjectDetails`.
- **Design conservé** : cartes projet, `ProgressBar`, `badge badge-soft-*`,
  `avatar-group`.

## Intégration backend future

Remplacer le corps de `projectService.getAll()` par
`api.get('/projets').then(r => r.data)` (ou l'endpoint réel). Les composants
et la page restent identiques. `computeStats()` peut rester côté client ou
être remplacé par un endpoint d'agrégation.
