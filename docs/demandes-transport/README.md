# Workflow Demandes de Transport (Devis)

> Redesign du parcours de réservation client : une **demande de transport**
> (devis) est désormais chiffrée par un gestionnaire **avant** de devenir une
> **Mission**. Cela reflète le fonctionnement réel d'une société de transport :
> le prix final est validé par un humain, la mission n'est créée qu'après
> acceptation du client.

## Pourquoi

Avant, la réservation client créait **instantanément** une `Mission` (`EN_ATTENTE`)
avec un prix calculé automatiquement par l'IA — sans validation humaine. Ce n'est
pas réaliste. Le nouveau flux introduit une entité intermédiaire, `TransportRequest`,
qui porte toute la négociation de devis. La `Mission` (et tout le pipeline
existant : OptimisateurFlotteIA, affectation véhicule/chauffeur, suivi GPS) reste
**inchangée** — elle n'est créée qu'à l'acceptation du devis.

## Cycle de vie

```
                         (admin chiffre)              (client accepte)
  PENDING_QUOTATION ───────────────────▶ QUOTATION_SENT ─────────────▶ ACCEPTED
        │  ▲                                    │                    (Mission créée)
        │  │ (client édite)                     │
   (client annule)                        (client refuse)
        │                                       │
        ▼                                       ▼
     CANCELLED                              REJECTED
```

| Statut | Qui agit | Actions possibles |
|--------|----------|-------------------|
| `PENDING_QUOTATION` | Client | **voir / éditer / annuler** sa demande |
| `PENDING_QUOTATION` | Staff | **chiffrer** et envoyer le devis |
| `QUOTATION_SENT` | Client | **accepter** (→ Mission) / **refuser**. Édition et annulation **impossibles** |
| `ACCEPTED` | — | terminal — une `Mission` `EN_ATTENTE` existe (`missionId`) |
| `REJECTED` / `CANCELLED` | — | terminal — aucune Mission créée |

## Rôles

- **Client** (`CLIENT`) — portail frontoffice `/account/reserver` (soumission) et
  `/account/demandes` (suivi, édition, acceptation/refus).
- **Gestionnaire / Admin** (`GESTIONNAIRE`, `ADMIN`, `ADMINISTRATEUR`) — back office
  `/gestion/demandes-transport` (revue, chiffrage, envoi du devis).

## Prix IA

Le prix ponctuel vient du service partagé `CalculateurPrixTrajetIA` (`/predict`,
:8000) — **le même** que le back office (voir `aiPricingService`) et le portail
client. À la soumission, Mission.API dérive et **stocke** une fourchette indicative
(±8 %, `AiPriceRangeCalculator.cs`) affichée au client. Le prix **final** reste
décidé par le gestionnaire : prix IA / prix IA modifié / prix manuel.

## Modèle de données

Nouvelle table `TransportRequests` (Mission.API, base partagée `xpark_gmao`,
créée par le bloc idempotent `CREATE TABLE IF NOT EXISTS` de `Program.cs`, comme
`SupportTickets` / `LivePositions`). Champs clés : trajet + fret (`VilleDepart`,
`VilleArrivee`, `CargoDescription`, `CargoWeightKg`, `PassengerCount`,
`DateSouhaitee`), snapshot IA (`AiEstimatedPrice`, `AiPriceRangeMin/Max`,
`AiVehicleTypeRecommended`, `DistanceKm`), devis (`Statut`, `FinalPrice`,
`PricingMethod`, `AdminNote`, `QuotedBy*`), réponse client (`DateClientReponse`,
`ClientRejectionReason`/`ClientCancelReason`), et `MissionId` (lien vers la Mission
créée, sans FK — même convention que `SupportTicket.MissionId`).

## API (Mission.API — `TransportRequestsController`)

Routes nichées sous `/api/missions/demandes` (déjà proxifiées par la passerelle du
back office → aucune modification nginx).

| Méthode & route | Rôle | Effet |
|-----------------|------|-------|
| `POST /api/missions/demandes` | client | crée la demande (`PENDING_QUOTATION`) |
| `GET /api/missions/demandes/my` | client | ses demandes |
| `GET /api/missions/demandes/my/{id}` | client | détail |
| `PUT /api/missions/demandes/my/{id}` | client | édite (si `PENDING_QUOTATION`) |
| `PUT /api/missions/demandes/my/{id}/cancel` | client | retire (si `PENDING_QUOTATION`) |
| `PUT /api/missions/demandes/my/{id}/accept` | client | **crée la Mission** (si `QUOTATION_SENT`) |
| `PUT /api/missions/demandes/my/{id}/reject` | client | refuse (si `QUOTATION_SENT`) |
| `GET /api/missions/demandes?statut=` | staff | liste filtrable |
| `GET /api/missions/demandes/{id}` | staff | détail |
| `PUT /api/missions/demandes/{id}/quote` | staff | envoie le devis → `QUOTATION_SENT` |

L'acceptation réutilise `MissionService.CreateMissionFromAcceptedRequestAsync`
(logique de construction de Mission factorisée depuis l'ancien
`CreateClientRequestAsync`, désormais supprimé avec la route
`POST /missions/client-request`).

## Fichiers

**Backend** — `Entities/TransportRequest.cs`, `Entities/Enums.cs`
(`StatutDemandeTransport`, `MethodePrix`), `Controllers/TransportRequestsController.cs`,
`Services/AiPriceRangeCalculator.cs`, `Services/MissionService.cs` (refactor),
`Data/MissionDbContext.cs`, `Program.cs` (schéma).

**Front office** — `lib/transportRequestService.js`, `app/account/reserver/page.js`
(soumission + fourchette), `app/account/demandes/page.js` (nouvelle page),
`components/portal/ClientPortalLayout.js` (nav + cloche notifications).

**Back office** — `src/types/transportRequest.ts`, `src/services/transportRequestService.ts`,
`src/app/(admin)/gestion/demandes-transport/page.tsx` + `components/QuotationModal.tsx`,
`src/assets/data/menu-items.ts`, `src/routes/index.ts`.

## Ce qui ne change pas

`StatutMission`, l'entité/table `Mission`, le déclenchement de l'OptimisateurFlotteIA
(bouton « Optimiser le planning »), le suivi GPS (`TrackingController` / `LivePositions`),
et les endpoints de `CalculateurPrixTrajetIA`.
