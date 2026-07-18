# Fleet — Clean Architecture

> Deuxième microservice migré (après IAM, même recette — voir
> `microservices/IAM/ARCHITECTURE.md` pour la méthode détaillée).
> **Aucun changement de comportement** : mêmes routes, mêmes contrats, même
> base, même bus d'événements.

## 1. Structure

```
microservices/Fleet/
├── Fleet.Domain/               ← cœur métier
│   └── Entities/               Vehicule, Equipement, Assurance,
│                               DocumentAdministratif, Carburant, Source,
│                               FleetEntities (types communs)
│
├── Fleet.Application/          ← cas d'usage
│   ├── DTOs/                   7 fichiers (contrats API inchangés)
│   ├── Interfaces/             IVehiculeService, IAssuranceService,
│   │                           IDocumentService, ICarburantService,
│   │                           ISourceService, IXparkEventBus (port du bus)
│   └── Mapping/                FleetProfile (AutoMapper)
│
├── Fleet.Infrastructure/       ← détails techniques
│   ├── Data/                   FleetDbContext (EF Core / PostgreSQL partagé)
│   ├── Services/               5 implémentations (logique déplacée telle quelle)
│   ├── Messaging/              XparkEventBus — RabbitMQ BRUT (exchange topic
│   │                           `xpark.ai`, JSON sans enveloppe MassTransit,
│   │                           consommé par les services Python IBOA/optimiseur)
│   └── DependencyInjection.cs  AddFleetInfrastructure(config)
│
└── Fleet.API/                  ← présentation
    ├── Controllers/            Vehicules, Equipements, Assurances, Documents,
    │                           Carburants, Sources
    ├── Middleware/             ErrorHandlingMiddleware
    ├── Consumers/              (placeholder — aucun consumer RabbitMQ à ce jour)
    └── Program.cs · Dockerfile
```

## 2. Décisions spécifiques à Fleet

| Sujet | Décision |
|---|---|
| `IXparkEventBus` | interface extraite du fichier d'implémentation vers `Application/Interfaces` : c'est un **port** (l'Application déclenche des événements métier, l'Infrastructure choisit RabbitMQ). |
| `RabbitMQ.Client 7.0.0` explicite | le code utilise `IChannel` (API v7) — version identique à celle qu'apportait transitivement MassTransit.RabbitMQ 8.3.6 : binaire équivalent, zéro changement de code. |
| `EquipementsController` | utilise **directement `FleetDbContext`** (aucun service n'existait). Conservé tel quel — en créer un aurait été une réécriture (contraire à l'objectif). Candidat d'amélioration future documenté. |
| Publication d'événements | brute (sans MassTransit) **volontairement** : les consommateurs Python lisent le JSON directement. Le pattern est identique à Mission.API. |

## 3. Vérifications effectuées (protocole)

| Vérification | Résultat |
|---|---|
| `dotnet build` Release | ✅ 0 erreur |
| `docker compose build fleet-api` + run | ✅ /health healthy |
| GET vehicules (paginé) · vehicules/disponibles · equipements · sources · carburants | ✅ 200 |
| GET assurances/vehicule/{id} · documents/vehicule/{id} | ✅ 200 |
| GET /api/assurances nu | 405 — **comportement d'origine** (pas de route GET liste, vérifié dans le contrôleur) |
| RBAC sans jeton | ✅ 401 |
| Chaîne backoffice :3000 → passerelle → Fleet | ✅ 200 |
| Logs conteneur | ✅ aucune erreur |

Note de migration : le dossier hérité `microservices/Fleet.API/{bin,obj}` peut
subsister (artefacts verrouillés par l'IDE au moment du déplacement) — il est
gitignoré et supprimable à tout moment.
