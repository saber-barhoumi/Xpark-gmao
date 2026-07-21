# Finance — Clean Architecture

> Migré selon la recette commune du projet (détails de la méthode :
> `microservices/IAM/ARCHITECTURE.md`). **Comportement 100 % identique.**

## Structure

```
microservices/Finance/
├── Finance.Domain/Entities        Facture + UtilisateurRef/MissionRef
│                                  (projections LECTURE SEULE de la base
│                                  partagée pour l'enrichissement), Enums
├── Finance.Application/           5 DTOs · IFacturationService · IRepositories
│                                  (ports) · FinanceProfile (mapping)
├── Finance.Infrastructure/        FinanceDbContext · FactureRepository
│                                  (numérotation FAC-AAAAMM-XXXX) ·
│                                  FacturationService (TVA, enrichissement
│                                  client/mission) · DependencyInjection
└── Finance.API/                   FacturesController (+ stubs Carburants/
                                   Sources : fonctions migrées vers Fleet.API)
```

## Décisions spécifiques

- `CarburantService`/`ICarburantService` sont des **marqueurs historiques**
  (la gestion carburant vit dans Fleet.API) — jamais enregistrés en DI,
  comportement d'origine conservé.
- Les projections `UtilisateurRef`/`MissionRef` restent dans le Domain :
  lecture seule de la base partagée, pattern assumé du système (le nom du
  client doit figurer sur le document de facture imprimable).

## Vérifications effectuées

`dotnet build` 0 erreur · image Docker · /health healthy · **chaîne de
facturation complète via la passerelle :3000** : liste 200, création 201
(FAC-202607-0003, TTC calculé), détail enrichi (nom client), encaissement →
PAYEE · logs propres.
