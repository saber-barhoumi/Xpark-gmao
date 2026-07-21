# Alerts — Clean Architecture

> Migré selon la recette commune du projet (détails de la méthode :
> `microservices/IAM/ARCHITECTURE.md`). **Comportement 100 % identique.**

## Structure

```
microservices/Alerts/
├── Alerts.Domain/Entities         Alerte, réf Vehicule, Enums
├── Alerts.Application/            3 DTOs · IAlertService · IRepositories
│                                  (ports) · AlertsProfile (mapping)
├── Alerts.Infrastructure/         AlertsDbContext · AlerteRepository +
│                                  GenericRepository · AlerteService ·
│                                  DependencyInjection.AddAlertsInfrastructure
└── Alerts.API/                    AlertesController (cloche de notifications
                                   du backoffice + page /alertes)
```

## Décisions spécifiques

- Le service « Notification » de la liste cible du refactor **est** Alerts.API
  (nom historique du système, conservé pour ne casser aucune route ni aucun
  client frontend).

## Vérifications effectuées

`dotnet build` 0 erreur · image Docker · /health healthy · GET alertes +
count-unread 200 · 401 sans jeton · logs propres.
