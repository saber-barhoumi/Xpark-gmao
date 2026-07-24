# Gestionnaire de fichiers — `/apps/file-manager`

## Avant

- Données issues du helper de template `getAllFiles()` (fichiers génériques).
- `FileData.tsx` : ~600 lignes de lignes de tableau **codées en dur et
  commentées**.
- Barre latérale (`OffcanvasCard.tsx`) : menu de dossiers **mort**
  (My Files, Google Drive, Starred…), encart « Upgrade to Pro », aucune
  notion de **stockage**.
- Menu d'actions (Share / Download / Delete) **sans gestionnaire**.
- Ni recherche, ni filtre, ni états.

## Après

- **Couche service** `src/services/fileService.ts` : `ManagedFile` typé,
  `FileKind` (pdf/image/excel/word/zip/text) avec icône+couleur, dossiers
  métier (documents véhicule, factures, photos, rapports, archives),
  `computeFolders()` (comptage), `computeStorage()` (utilisé/total +
  répartition par type). Mock XPARK.
- **Orchestrateur** (`FIleManager.tsx`) : chargement async, état partagé
  (dossier actif, recherche, type), tri épinglés/récents, **favori** et
  **suppression** (avec confirmation).
- **Barre latérale** (`OffcanvasCard.tsx`) : dossiers avec **comptage
  dynamique** + **jauge de stockage** (couleur selon le taux).
- **Panneau principal** (`File.tsx`) : recherche + filtre type, liste avec
  **loading / error (Réessayer) / empty**, favori en un clic, menu d'actions
  branché.

## Explication technique

- **Fichiers** : `FIleManager.tsx` (orchestrateur), `OffcanvasCard.tsx`
  (sidebar), `File.tsx` (liste). `FileData.tsx` **supprimé**.
- **Flux** : `FIleManager` charge `fileService.getAll()` → `computeFolders`
  / `computeStorage` (memo) → filtrage (dossier + type + recherche) + tri →
  props vers sidebar et liste. Les actions (favori, suppression) modifient
  l'état local (optimiste).
- **Responsive** : sidebar fixe ≥ xxl, sinon **offcanvas** déclenché par un
  bouton menu.

## Intégration backend future

`getAll()` → API documentaire. Les documents véhicule existent déjà côté
Fleet (`/documents`, `/assurances`) : une agrégation pourrait les exposer.
Les actions `toDo(...)` (partage, lien, téléchargement) marquent les points
de branchement.
