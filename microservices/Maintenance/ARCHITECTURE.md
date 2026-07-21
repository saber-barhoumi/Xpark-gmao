# Maintenance — Clean Architecture

> Migré selon la recette commune du projet (détails de la méthode :
> `microservices/IAM/ARCHITECTURE.md`). **Comportement 100 % identique** :
> mêmes routes, mêmes contrats, même base partagée.

## Structure

```
microservices/Maintenance/
├── Maintenance.Domain/Entities    Intervention, OrdreTravail, PieceRechange,
│                                  Attachment, Commentaire, HistoriqueStatutOT,
│                                  InterventionPiece, refs partagées, Enums
├── Maintenance.Application/       4 DTOs · IMaintenanceService · IRepositories
│                                  (ports) · MaintenanceProfile (mapping)
├── Maintenance.Infrastructure/    MaintenanceDbContext · GenericRepository +
│                                  InterventionRepository · MaintenanceService ·
│                                  DependencyInjection.AddMaintenanceInfrastructure
└── Maintenance.API/               3 contrôleurs : Interventions, OrdreTravail,
                                   PiecesRechange
```

## Flux de dépendances

`API → Application → Domain` ; `Infrastructure → Application` (implémente les
interfaces). L'API ne touche l'Infrastructure que via
`AddMaintenanceInfrastructure(configuration)`.

## Décisions spécifiques

- Les repositories étaient déjà séparés interface/implémentation avant la
  migration : la répartition par couche (ports dans l'Application,
  implémentations en Infrastructure) s'est faite sans toucher au code.

## Vérifications effectuées

`dotnet build` 0 erreur · image Docker · /health healthy · interventions +
ordres-travail + pieces-rechange 200 · 401 sans jeton · logs propres.
