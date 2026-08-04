# Maintenance

**Source analysee** : `microservices/Maintenance`

**Conteneur** : `maintenance-api` — port publie `5004`

**Role** : Interventions, ordres de travail, pieces de rechange

## Ce que contient le service

| Element | Nombre |
|---|---|
| Controleurs | 3 |
| Endpoints HTTP | 32 |
| Entites du domaine | 7 |
| Enumerations locales | 8 |
| DTO | 4 |
| Interfaces (ports) | 3 |
| Implementations | 1 |
| DbSet | 8 |
| Consommateurs RabbitMQ | 0 |
| Hubs SignalR | 0 |

**Couches** : API, Application, Domain, Infrastructure

**DbContext** : `MaintenanceDbContext`

## Controleurs et routes

- `InterventionsController` — route `api/[controller]` (8 endpoints)
- `OrdreTravailController` — route `api/ordres-travail` (16 endpoints)
- `PiecesRechangeController` — route `api/pieces-rechange` (8 endpoints)

## Diagrammes de ce dossier

| Fichier | Contenu |
|---|---|
| `Maintenance-sequence.puml` | Sequence d'un flux metier reel du service |
| `Maintenance-usecase.puml` | Cas d'utilisation et acteurs (roles releves dans le code) |
| `Maintenance-communication.puml` | Echanges avec les autres composants et les protocoles employes |
| `Maintenance-entities.puml` | Entites persistees, cles et relations |
| `Maintenance-class.puml` | Classes des quatre couches et leurs dependances |
| `Maintenance-component.puml` | Composants internes et points d'entree |
| `Maintenance-package.puml` | Organisation en paquets et sens des dependances |
| `Maintenance-activity.puml` | Deroulement metier de bout en bout |
| `Maintenance-state.puml` | Etats et transitions des objets du domaine |
| `Maintenance-database.puml` | Persistance et tables accedees |
| `Maintenance-api-flow.puml` | Cheminement complet d'un appel API |
| `Maintenance-service-flow.puml` | Traversee des couches internes |

## Diagrammes IA non generes

Conformement a la consigne « ne generer que ce qui existe » :

- `Maintenance-classifier-ia-pipeline.puml` : pas de classification dans ce service.
- `Maintenance-ml-pipeline.puml` : aucun modele d'apprentissage automatique dans ce service.
- `Maintenance-prediction-flow.puml` : pas de logique de prediction dans ce service.
- `Maintenance-ocr-flow.puml` : aucun code OCR dans ce service — l'OCR de la plateforme est realise cote navigateur par `frontend/backoffice/src/services/groqOCRService.ts` (API xAI Grok).
- `Maintenance-rag-flow.puml` : pas de recherche augmentee dans ce service.
- `Maintenance-optimization-flow.puml` : pas de logique d'optimisation dans ce service.
- `Maintenance-training-flow.puml` : aucun code d'entrainement dans le depot.
- `Maintenance-inference-flow.puml` : pas d'inference dans ce service.

## Regeneration

Voir [`../../README.md`](../../README.md).
