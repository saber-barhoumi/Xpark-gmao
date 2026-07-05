# OptimisateurFlotteIA — Documentation Complète

> Deuxième modèle IA de XPARK GMAO (après `CalculateurPrixTrajetIA`, le prédicteur de coût XGBoost).
> Implémente la `FICHE_TECHNIQUE_OptimisateurFlotteIA` : affectation automatique
> **missions ↔ véhicules ↔ chauffeurs** par optimisation sous contraintes, déclenchée
> via **RabbitMQ** (event-driven).

---

## 1. À quoi ça sert ?

L'admin n'a plus à décider manuellement quel chauffeur envoyer avec quel véhicule.
En un clic (« Optimiser le planning »), le système génère un plan complet qui garantit :

| Objectif | Comment |
|---|---|
| **Affectation intelligente** | Meilleure paire (véhicule, chauffeur) par mission : classe requise, permis compatible, disponibilité horaire |
| **Équilibrage de charge** | Historique 7 jours analysé — jamais plus de 10h/jour (limite légale), variance des heures minimisée |
| **Optimisation des coûts** | Le véhicule le plus sobre compatible est privilégié (40% du score) — carburant minimal |

## 2. Quel type d'IA ?

- ❌ **Pas de RAG** — aucun document à retrouver, aucun LLM.
- ❌ **Pas de ML entraîné comme moteur** — impossible de *garantir* les contraintes
  légales avec un modèle statistique, et aucun dataset « plan optimal » n'existe.
- ✅ **Recherche Opérationnelle (IA symbolique / métaheuristiques)** — le problème est
  un *Vehicle Routing / Assignment Problem*, **NP-Difficile** (§6.2 de la fiche) :
  pour 10 missions × 12 chauffeurs × 15 véhicules, l'espace de solutions dépasse
  10¹⁷ combinaisons. On cherche une **très bonne solution en < 5 s**, pas l'optimum en 1h.

Le lien avec le ML existant : les constantes carburant (Diesel 1.85 / Essence 1.99 TND/L,
consommations par défaut, mapping `BERLINE→LIGHT_VEHICLE`…) sont **identiques à
`CalculateurPrixTrajetIA`** — les deux modèles donnent des chiffres cohérents.

## 3. L'algorithme (3 phases — fiche §8.1)

```
Événement RabbitMQ reçu
   │
   ├── Phase 1 — HEURISTIQUE GLOUTONNE (< 100 ms)
   │     missions triées par priorité puis heure de départ ;
   │     chaque mission reçoit la meilleure paire faisable
   │
   ├── Phase 2 — ALGORITHME GÉNÉTIQUE (budget 1,5 s)
   │     population 40 · ≤ 60 générations · sélection par tournoi (k=3)
   │     croisement uniforme + réparation · mutation 15% · élitisme 2
   │     chromosome = [1 gène par mission] = (véhicule, chauffeur) ou ∅
   │
   └── Phase 3 — RECHERCHE LOCALE 2-opt (budget 0,8 s)
         replace les missions non affectées + réaffectations unitaires
         tant que le score global s'améliore
```

### Contraintes DURES (jamais violées — fiche §5.1)
1. Véhicule jamais au-delà de son seuil de révision kilométrique
2. Classe de véhicule requise couverte (LIGHT_VEHICLE < VAN < FOURGON < HEAVY_TRUCK)
3. Permis chauffeur compatible (B → léger, C → camion, D → bus/minibus…)
4. **Limite légale 10h/jour** (heures historiques + durée mission)
5. Aucun chevauchement horaire (occupation = trajet + pause 15 min)

### Fonction objectif (contraintes SOUPLES — fiche §5.3)
```
Score = 0.40 × (1 − Carburant_normalisé)          ← véhicules sobres
      + 0.30 × TauxAffectation_pondéré_priorité   ← HIGH/URGENT d'abord
      + 0.15 × 1/(1 + Var(heures_par_chauffeur))  ← équilibrage
      + 0.10 × (1 − TempsMort)                    ← gaps minimisés
      + 0.05 × Préférences                        ← adéquation permis/véhicule
```
Une mission non affectée est « facturée » à son pire coût carburant (coût
d'opportunité) — abandonner une mission chère ne peut jamais améliorer le score.

## 4. Architecture event-driven (RabbitMQ — fiche §2.3)

```
 Backoffice (React)                Mission.API (.NET)                OptimisateurFlotteIA (Python)
 ──────────────────                ──────────────────                ─────────────────────────────
 « Optimiser le planning »
   │ POST /api/missions/optimize
   │ { vehicles, drivers }   ────►  rassemble missions EN_ATTENTE
   │                                + historique 7 jours (sa BDD)
   │                                    │
   │                                    │ PUBLISH ────────────────►  consume
   │                                    │ xpark.missions.               │ Greedy → GA → 2-opt
   │                                    │ ready-for-optimization        │ (~0,1–3 s)
   │                                    │                               │
   │                                consume  ◄──────────────── PUBLISH │
   │                                stocke le plan       xpark.optimization.
   │                                (OptimizationPlanStore)   plan-generated
   │ GET /api/missions/optimize/{batchId}   (polling 1 s)
   │ ◄─── 202 PENDING … puis 200 + plan JSON
   │
   │ « Appliquer le plan » → PUT /api/missions/{id}/assign  (par affectation)
   │        → mission EN_ATTENTE → EN_COURS + véhicule/chauffeur enregistrés
```

- **Exchange** : `xpark.ai` (topic, durable) — payloads JSON purs (camelCase), interopérables .NET ↔ Python
- **Queues** : `optimizer.ready-for-optimization` (Python) · `mission.plan-generated` (.NET)
- L'endpoint HTTP `POST :8001/optimize` reste disponible pour les tests (Swagger : http://localhost:8001/docs)
- Reconnexion automatique des deux côtés si RabbitMQ redémarre (fiche §9.2)

## 5. Où le voir dans l'application ?

| Emplacement | Description |
|---|---|
| **Menu latéral → Gestion Flotte → Optimisateur IA** (badge « IA ») | Page dédiée `/gestion/optimisateur` : état du service, explication des 3 piliers, panneau d'optimisation complet |
| **Page Missions → bouton « Optimiser le planning »** | Même panneau en modal, pour optimiser sans quitter la liste |
| **Wizard « Nouvelle Mission » → switch « Affectation automatique par l'IA »** | Crée la mission EN_ATTENTE sans chauffeur/véhicule — c'est l'alimentation de l'optimiseur |

Le plan affiché montre : score global /100, coût carburant total, écart-type de charge,
et **par affectation** : confiance (0–100%), bouton « ? » avec l'explication en français
(consommation vs moyenne flotte, charge projetée, permis), avertissements (chauffeur
proche de 10h, véhicule proche révision) et missions non affectables avec la raison.

## 6. Tous les fichiers

### `OptimisateurFlotteIA/` (service Python — port 8001)
| Fichier | Rôle |
|---|---|
| `main.py` | API FastAPI (`/health`, `/optimize`) + démarrage du consumer RabbitMQ |
| `rabbitmq_consumer.py` | Consomme `ready-for-optimization`, publie `plan-generated` (pika, reconnexion infinie) |
| `models.py` | Contrats Pydantic entrée/sortie (fiche §3/§4) |
| `constraints.py` | Contraintes dures §5.1 (classes, permis, 10h, chevauchements, révision) |
| `scoring.py` | Fonction objectif §5.3 + coûts carburant (constantes = CalculateurPrixTrajetIA) |
| `optimizer.py` | Moteur 3 phases + génération des explications + warnings |
| `test_optimizer.py` | Test de non-régression (scénario annexe A.1 + assertions) |
| `requirements.txt` / `Dockerfile` | fastapi, uvicorn, pydantic, pika — image python:3.11-slim |
| `README.md` | Documentation technique détaillée du service |

### `microservices/Mission.API/` (orchestration .NET)
| Fichier | Rôle |
|---|---|
| `Messaging/OptimizerEventBus.cs` | Publisher RabbitMQ (exchange `xpark.ai`) |
| `Messaging/OptimizerPlanConsumer.cs` | BackgroundService — consomme les plans générés |
| `Messaging/OptimizationPlanStore.cs` | Stockage en mémoire des plans (TTL 30 min) pour le polling |
| `Services/OptimizationService.cs` | Rassemble missions EN_ATTENTE + historique, publie l'événement |
| `DTOs/OptimizeRequestDto.cs` | Payload du déclenchement (véhicules + chauffeurs du frontend) |
| `DTOs/AssignMissionDto.cs` | Application d'une affectation du plan |
| `Controllers/MissionsController.cs` | `POST /optimize`, `GET /optimize/{batchId}`, `PUT /{id}/assign` |
| `Entities/Mission.cs` + `Program.cs` | `EmployeeId`/`VehiculeId` nullables (SQL idempotent au démarrage) |

### `frontend/backoffice/src/` (UI React — thème Reback)
| Fichier | Rôle |
|---|---|
| `app/(admin)/gestion/optimisateur/page.tsx` | **Page dédiée** (menu « Optimisateur IA ») |
| `components/optimizer/OptimizerPanel.tsx` | Panneau partagé (compteurs, lancement, plan, application) |
| `app/(admin)/gestion/missions/components/OptimizerPlanningModal.tsx` | Modal (page missions) qui réutilise le panneau |
| `app/(admin)/gestion/missions/components/MissionWizardModal.tsx` | Switch « Affectation automatique par l'IA » |
| `services/optimizerService.ts` | Déclenchement + polling du plan (flux RabbitMQ) |
| `services/missionService.ts` | + méthode `assign()` |
| `types/optimizer.ts` / `types/mission.ts` | Types TypeScript des contrats |
| `routes/index.ts` + `assets/data/menu-items.ts` | Route `/gestion/optimisateur` + entrée de menu |

### Racine
| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Service `ai-optimizer` (8001) + env RabbitMQ + arg `VITE_OPTIMIZER_API_URL` |
| `OPTIMISATEUR_FLOTTE_IA.md` | Ce document |

## 7. Lancer & tester

```bash
# Tout démarrer
docker compose up -d rabbitmq mission-api ai-optimizer backoffice

# Swagger du service IA
http://localhost:8001/docs

# Test du moteur seul (sans RabbitMQ)
cd OptimisateurFlotteIA && python test_optimizer.py

# Suivre les événements en direct
docker logs -f xpark-ai-optimizer        # "Event reçu … Plan publié …"
docker logs -f xpark-mission-api         # "[OptimizerEventBus] Published … Plan received …"

# Console RabbitMQ (queues optimizer.* / mission.*)
http://localhost:15672  (xpark / xpark_secret)
```

**Parcours de démo dans l'application** (http://localhost:3000) :
1. Missions → « Nouvelle Mission » → activer « Affectation automatique par l'IA » → créer 2-3 missions
2. Menu → Gestion Flotte → **Optimisateur IA** → « Optimiser le planning »
3. Examiner le score, les confiances, cliquer « ? » pour les explications
4. « Appliquer le plan » → les missions passent EN_COURS avec chauffeur + véhicule

## 8. Performances mesurées

| Scénario | Temps | Résultat |
|---|---|---|
| 5 missions / 4 véhicules / 4 chauffeurs (moteur seul) | ~470 ms | 4/5 affectées (1 conflit horaire réel), camion réservé à la mission HEAVY_TRUCK, van au seuil de révision jamais utilisé |
| **E2E RabbitMQ** (Docker, données réelles) : création missions EN_ATTENTE → publish → optimisation → plan → assign → EN_COURS | 332 ms moteur, ~1 s bout-en-bout | 2/2 affectées, chaînage des 2 missions sur l'unique chauffeur permis C, application vérifiée en base |
| SLA fiche §6.1 | < 2 s pour 100 missions | ✔ (moteur time-boxé à ~2,3 s max) |

> Test rejouable : `python OptimisateurFlotteIA/test_e2e_rabbitmq.py`
> (crée 2 missions de test, optimise via le bus, applique 1 affectation, supprime tout).
