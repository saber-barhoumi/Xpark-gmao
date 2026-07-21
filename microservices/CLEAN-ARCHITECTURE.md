# XPARK — Migration Clean Architecture (vue d'ensemble)

7 microservices .NET migrés en juillet 2026, **sans aucun changement de
comportement** (routes, contrats JSON, base partagée, RabbitMQ, SignalR, JWT).
Chaque service suit la même structure :

```
microservices/<Service>/
├── <Service>.Domain          entités, enums — ne dépend de rien*
├── <Service>.Application     DTOs, interfaces (ports), règles métier pures, mapping
├── <Service>.Infrastructure  EF Core, repositories, RabbitMQ, SignalR, DI
└── <Service>.API             contrôleurs, middleware, Program.cs, Dockerfile
```

\* seule concession : `XparkGMAO.Shared` (enums transverses — la base
PostgreSQL est partagée entre services, ces enums sont le vocabulaire commun).

| Service | Commit local | Docs | Points notables |
|---|---|---|---|
| IAM | `bb7c24f` | IAM/ARCHITECTURE.md | JWT/MFA/emails ; **recette de migration détaillée** |
| Fleet | `1133fa6` | Fleet/ARCHITECTURE.md | bus xpark.ai (RabbitMQ brut), IXparkEventBus extrait |
| Mission | `bd93652` | Mission/ARCHITECTURE.md | devis, GPS, OptimisateurFlotteIA (consumer), règle métier pure en Application |
| Maintenance | `07700f7` | Maintenance/ARCHITECTURE.md | repositories ports/impl répartis |
| Finance | `ccd7a92` | Finance/ARCHITECTURE.md | facturation XPARK, projections lecture seule |
| Alerts (= Notification) | `f81bdef` | Alerts/ARCHITECTURE.md | notifications système |
| Chat | `7690f8d` | Chat/ARCHITECTURE.md | SignalR en Infrastructure, Application minimale assumée |

**Ordre appliqué** : IAM → Fleet → Mission → Maintenance → Finance → Alerts → Chat.

**Écarts vs la liste cible initiale (expliqués)** :
- *Tracking* fait partie de Mission.API (TrackingController + LivePositions) —
  pas de service séparé à migrer ;
- *Notification* = Alerts.API (nom historique conservé, aucune route cassée) ;
- *Analytics* n'existe pas comme service .NET (les KPIs sont servis par la
  passerelle héritée `backend` :5000) ;
- services **Python** : CalculateurPrixTrajetIA / OptimisateurFlotteIA / IBOA
  sont de petits services focalisés (un domaine chacun) ; AyshaaRAG possède sa
  propre architecture modulaire (agent/llm/rag/tools/speech — voir
  `AyshaaRAG/docs/agent-architecture.md`).

## La recette commune (résumé)

1. `git mv` du service vers `<Svc>/<Svc>.API` puis répartition des fichiers
   par couche (historique git conservé, zéro réécriture de logique).
2. 3 nouveaux csproj : Domain (→ Shared), Application (→ Domain),
   Infrastructure (→ Application, plus `FrameworkReference
   Microsoft.AspNetCore.App` et des `<Using>` globaux pour que le code déplacé
   compile **à l'identique**).
3. Namespaces réécrits par script ; interfaces embarquées dans des fichiers
   d'implémentation extraites vers l'Application (IMfaService, IXparkEventBus,
   IOptimizationService, IOptimizerEventBus).
4. `DependencyInjection.Add<Svc>Infrastructure()` remplace les enregistrements
   techniques de Program.cs — unique point de câblage.
5. Dockerfile multi-projets (restore par couche = cache optimal), chemin
   compose ajusté (`<Svc>/<Svc>.API/Dockerfile`), contexte inchangé.
6. Validation par service : `dotnet build` 0 erreur → image Docker → /health →
   tous les endpoints (avec/sans JWT, RBAC) → consumers RabbitMQ → hub SignalR
   → logs conteneur.
7. Commit local `refactor(<svc>): …` — **aucun push avant la validation
   manuelle finale** (consigne).

## Balayage final d'intégration (après les 7 migrations)

IAM, Fleet, Mission, Maintenance, Finance, Alerts, Chat : `/health` **healthy** ·
login via la chaîne backoffice `:3000` → **200** · consumer
`xpark.optimization.plan-generated` à l'écoute · négociation SignalR **200** ·
chaîne de facturation complète **OK**.

## Reste à faire avant push

- [ ] Test E2E manuel complet de la plateforme par le propriétaire du projet
- [ ] Sur accord explicite uniquement : push de l'ensemble vers `Saber`
- [ ] Nettoyage optionnel : coquilles héritées `<Svc>.API/{bin,obj}` restées
      sur disque (verrouillées par l'IDE au moment des déplacements) —
      gitignorées, sans effet, supprimables à tout moment
