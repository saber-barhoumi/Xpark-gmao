# Mission — Clean Architecture

> Troisième microservice migré (recette commune : voir IAM/ARCHITECTURE.md).
> Le plus riche fonctionnellement : missions, demandes de transport (devis),
> suivi GPS temps réel (XPARK Driver), OptimisateurFlotteIA (bus + consumer),
> support client, migration d'historique IA. **Comportement inchangé.**

## 1. Structure

```
microservices/Mission/
├── Mission.Domain/
│   └── Entities/               Mission, TransportRequest (workflow devis),
│                               LivePosition (GPS), SupportTicket, Employee/
│                               Vehicule (références base partagée), Enums
│
├── Mission.Application/
│   ├── DTOs/                   7 fichiers (missions, devis, optimisation…)
│   ├── Interfaces/             IMissionService, IHistoricalMigrationService,
│   │                           IMissionRepository (port), IOptimizationService*
│   │                           et IOptimizerEventBus* (*extraits des fichiers
│   │                           d'implémentation)
│   ├── Services/               AiPriceRangeCalculator — RÈGLE MÉTIER PURE
│   │                           (fourchette de prix devis) : c'est le seul code
│   │                           « calcul » du service, il vit dans l'Application
│   └── Mapping/                MissionProfile
│
├── Mission.Infrastructure/
│   ├── Data/                   MissionDbContext (+ schéma LivePositions/
│   │                           TransportRequests idempotent)
│   ├── Repositories/           GenericRepository, MissionRepository
│   ├── Services/               MissionService, OptimizationService,
│   │                           HistoricalMigrationService
│   ├── Messaging/              OptimizerEventBus (RabbitMQ brut xpark.ai),
│   │                           OptimizationPlanStore (mémoire), 
│   │                           OptimizerPlanConsumer (BackgroundService —
│   │                           écoute xpark.optimization.plan-generated)
│   ├── Startup/                AiHistoricalSeeder
│   └── DependencyInjection.cs  AddMissionInfrastructure(config)
│
└── Mission.API/
    ├── Controllers/            Missions, TransportRequests, Tracking,
    │                           Support, DataMigration
    └── Program.cs · Dockerfile
```

## 2. Décisions spécifiques

| Sujet | Décision |
|---|---|
| `AiPriceRangeCalculator` | classe statique **pure** → `Application/Services` : c'est une règle métier (la marge produit ±8 % du devis), pas un détail technique. |
| `IMissionRepository` | le fichier IRepositories.cs part dans `Application/Interfaces` (les repositories sont des **ports**), les implémentations restent en Infrastructure. |
| `IOptimizationService` / `IOptimizerEventBus` | extraits de leurs fichiers d'implémentation vers l'Application. |
| `XparkGMAO.Shared.AiTelemetry` | 2e projet partagé (entraînement IA prix : DbContext télémétrie + clients Fleet/Finance) — référencé par l'Infrastructure, copié dans le Dockerfile. |
| `OptimizerPlanConsumer` | BackgroundService → `Infrastructure/Messaging`, enregistré via `AddHostedService` dans l'extension DI. |

## 3. Vérifications effectuées (protocole)

| Vérification | Résultat |
|---|---|
| `dotnet build` Release | ✅ 0 erreur |
| Image Docker + conteneur | ✅ /health healthy |
| GET missions · missions/demandes (staff) | ✅ 200 |
| GET missions/my · missions/demandes/my (client) | ✅ 200 |
| GET missions/driver (staff/chauffeur) | ✅ 200 |
| Tracking live : client NON propriétaire → 403, staff → 200 | ✅ RBAC d'origine intact |
| Sans jeton | ✅ 401 |
| **Consumer RabbitMQ** | ✅ log `[OptimizerPlanConsumer] Listening on 'xpark.optimization.plan-generated'` |
| Logs conteneur | ✅ aucune erreur |
