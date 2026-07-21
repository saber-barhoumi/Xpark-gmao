# Chat — Clean Architecture

> Migré selon la recette commune du projet (détails de la méthode :
> `microservices/IAM/ARCHITECTURE.md`). **Comportement 100 % identique**,
> y compris le temps réel SignalR.

## Structure

```
microservices/Chat/
├── Chat.Domain/Entities           ChatEntities : conversations, messages,
│                                  participants (le fichier historique contient
│                                  aussi quelques DTOs — conservé tel quel,
│                                  séparation notée comme amélioration future)
├── Chat.Application/              VOLONTAIREMENT minimale : le contrôleur et le
│                                  hub travaillent directement avec le DbContext
│                                  (pattern d'origine, conservé sans réécriture).
│                                  Le projet existe pour l'uniformité de la
│                                  famille et accueillera les cas d'usage futurs.
├── Chat.Infrastructure/           ChatDbContext · **ChatHub (SignalR)** ·
│                                  consumers MassTransit ·
│                                  DependencyInjection.AddChatInfrastructure
└── Chat.API/                      ChatController REST · Program.cs (MapHub
                                   /chatHub, configuration SignalR + bus =
                                   pipeline d'hôte)
```

## Décisions spécifiques

- Le **hub SignalR est en Infrastructure**, conformément au gabarit cible du
  refactor ; son mapping (`MapHub<ChatHub>`) reste dans Program.cs car c'est
  une responsabilité du pipeline d'hôte.
- Aucune couche service introduite : en créer une aurait été une réécriture
  (contraire à l'objectif de préservation).

## Vérifications effectuées

`dotnet build` 0 erreur · image Docker · /health healthy · conversations 200 ·
**négociation SignalR POST /chatHub/negotiate → 200** · logs propres.
