# Intégration backend — XPARK Driver

L'app consomme les microservices XPARK GMAO existants. Aucune duplication de
logique métier : elle appelle les mêmes API que le Front/Back Office.

## 1. Services & endpoints

| Service | Endpoint | Usage dans l'app | Fichier |
|---|---|---|---|
| IAM.API :5001 | `POST /api/auth/login` | connexion chauffeur | `src/api/auth.ts` |
| Mission.API :5003 | `GET /api/missions/driver?statut=` | missions du chauffeur | `src/api/missions.ts` |
| Mission.API :5003 | `POST /api/tracking/ping` | envoi position GPS | `src/api/tracking.ts` |

Endpoints backend **ajoutés pour cette feature** (côté Mission.API) :

| Méthode | Route | Qui | Rôle |
|---|---|---|---|
| POST | `/api/tracking/ping` | chauffeur/staff | enregistre une position |
| GET | `/api/tracking/mission/{id}/live` | client/chauffeur/staff | dernière position (+ `isFresh`) |
| GET | `/api/tracking/mission/{id}/history` | idem | trace du trajet |
| GET | `/api/missions/driver` | chauffeur/staff | missions du chauffeur connecté |

## 2. Authentification

`POST /api/auth/login` renvoie `{ data: { token } }`. Le JWT contient les claims
`userId`, `role` (`CHAUFFEUR`), `nom`, `prenom`. L'app **décode** le token (pas
d'endpoint `/me` léger) pour construire l'identité. Le jeton est ensuite envoyé
en `Authorization: Bearer …` sur chaque appel.

> Sécurité : un compte avec MFA activée est refusé côté app (flux terrain). Les
> endpoints de tracking vérifient le rôle et la propriété de la mission côté
> serveur (le client ne lit que SA mission).

## 3. Schéma de données — table `LivePositions`

Créée par Mission.API au démarrage (SQL idempotent). Modèle de la donnée de
suivi demandé :

| Colonne | Type | Description |
|---|---|---|
| `IdPosition` | bigserial (PK) | identifiant |
| `MissionId` | bigint | mission suivie |
| `DriverId` | bigint | chauffeur (IdUtilisateur, claim JWT) |
| `VehiculeId` | bigint? | véhicule |
| `Latitude` | double | latitude WGS84 |
| `Longitude` | double | longitude WGS84 |
| `SpeedKmh` | double? | vitesse instantanée |
| `Heading` | double? | cap 0..360 (direction) |
| `Accuracy` | double? | précision GPS (m) |
| `RecordedAt` | timestamptz | horodatage **appareil** |
| `ReceivedAt` | timestamptz | horodatage **serveur** |

Index : `(MissionId, RecordedAt DESC)` pour lire vite la dernière position.

## 4. Réponse de `GET /tracking/mission/{id}/live`

```json
{
  "hasFix": true,
  "latitude": 36.05, "longitude": 10.52,
  "speedKmh": 70, "heading": 160, "accuracy": 8,
  "recordedAt": "2026-07-11T12:00:00Z",
  "ageSeconds": 3.2,
  "isFresh": true
}
```

`isFresh` = position de moins de 60 s. Le Front Office ne bascule sur la position
réelle que si `isFresh` (sinon il garde la simulation).

## 5. Configuration réseau (important)

Les URLs sont dans `.env` (`EXPO_PUBLIC_IAM_API_URL`, `EXPO_PUBLIC_MISSION_API_URL`).
Sur un vrai téléphone, `localhost` = le téléphone : mettre l'**IP LAN** du PC
XPARK. Voir [installation.md](06-installation.md).

## 6. Le lien avec le Front Office

Côté Front Office (`frontend/frontoffice`), le module de suivi
(`lib/tracking/trackingEngine.js → snapshotFromPosition`) convertit la position
GPS réelle en progression/ETA/état et l'affiche sur la carte Leaflet. C'est la
même donnée `LivePositions`, lue via `/tracking/.../live`. La boucle
téléphone → backend → carte client est ainsi **complète**.
