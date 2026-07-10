# 📍 Suivi en direct — `/account/tracking`

## Ce que voit le client

- Une **barre d'état** « Suivi actif » avec l'heure de dernière mise à jour et un bouton ⟳ Actualiser.
- Une **carte de suivi par mission active** (EN_ATTENTE ou EN_COURS) :
  - timeline 4 étapes : *Demande validée → Chauffeur affecté → En route → Livrée* ;
  - barre de **progression du trajet** (missions en route) ;
  - infos : chauffeur, véhicule, distance, **arrivée estimée (ETA)** ou coût estimé.
- Un **historique récent** (5 dernières missions terminées/annulées).

## Comment c'est fait

### Fichiers

| Fichier | Rôle |
|---|---|
| `frontend/frontoffice/app/account/tracking/page.js` | Page complète (timeline, progression, infos) |
| `frontend/frontoffice/lib/missionService.js` | `getMyMissions()` → `GET /api/missions/my` (existant) |
| `frontend/frontoffice/components/portal/ui.js` | `Badge`, `EmptyState`, formatage dates/TND |

### Données utilisées (Mission.API `/api/missions/my`)

`statut`, `dateDepart`, `villeDepart`, `villeArrivee`, `distanceKm`,
`chauffeurNom`, `vehiculeImmatriculation`, `coutEstimeAI`, `employeeId`.

### Logique clé

1. **Rafraîchissement automatique** : `setInterval(load, 30000)` dans un `useEffect`
   (nettoyé au démontage) — le statut évolue sans recharger la page.
2. **Étape courante de la timeline** (`stepIndex`) :
   - `TERMINEE` → étape 4 « Livrée » ;
   - `EN_COURS` → étape 3 « En route » ;
   - chauffeur/véhicule affecté → étape 2 « Chauffeur affecté » ;
   - sinon → étape 1 « Demande validée ».
3. **Progression du trajet** (`routeProgress`) : temps écoulé depuis `dateDepart`
   rapporté à la durée estimée `distanceKm / 60 km/h`. Plafonnée à **95 %** tant que
   la mission n'est pas clôturée (seule la clôture staff fait foi).
4. **ETA** : `dateDepart + distanceKm / 60 km/h`.

> Il n'y a pas encore de GPS embarqué dans les véhicules : la progression est une
> **estimation temporelle** honnête, recalée à chaque rafraîchissement sur le statut
> réel saisi par l'exploitation (affectation, départ, clôture).

## Comment tester

1. Se connecter en client → réserver un transport (`/account/reserver`).
2. Ouvrir `/account/tracking` : la mission apparaît « Demande validée », en attente d'affectation.
3. Côté backoffice, affecter chauffeur + véhicule → la timeline passe à « Chauffeur affecté » (≤ 30 s).
4. Passer la mission EN_COURS → barre de progression + ETA affichées.
