# OptimisateurFlotteIA — Moteur d'optimisation d'affectation flotte/chauffeurs

> Implémentation de la `FICHE_TECHNIQUE_OptimisateurFlotteIA` — service IA n°2 de XPARK GMAO
> (le n°1 étant `CalculateurPrixTrajetIA`, le prédicteur de coût de trajet XGBoost).

**Port : 8001 (hôte) → 8000 (conteneur) · Conteneur : `xpark-ai-optimizer` · Stack : Python 3.11 + FastAPI**

---

## 1. Quel type d'IA ? (ML ? RAG ? mathématique ?)

| Approche | Verdict | Pourquoi |
|---|---|---|
| **RAG** (Retrieval-Augmented Generation) | ❌ Non | Le RAG sert à donner des documents à un LLM. Ici il n'y a ni documents ni génération de texte libre — c'est un problème d'affectation de ressources. |
| **ML supervisé** (modèle entraîné) | ❌ Non (pas comme moteur) | Il n'existe pas de dataset étiqueté « plan optimal », et surtout un modèle appris ne peut pas **garantir** les contraintes dures (limite légale 10h, permis, révision). Une violation = risque légal/sécurité. |
| **Recherche Opérationnelle** (optimisation sous contraintes) | ✅ **Oui** | C'est un *Vehicle Routing / Assignment Problem*, NP-Difficile (§6.2 de la fiche). L'industrie (Google OR-Tools, OptaPlanner) le résout par heuristiques + métaheuristiques. La fiche technique le préconise explicitement (§8.1). |

Le « IA » ici est une **IA symbolique / métaheuristique** : Greedy + **Algorithme Génétique**
+ Recherche Locale, pilotés par une **fonction objectif multi-critères mathématique** (§5.3).
Le lien avec le ML existant : les constantes de coût carburant (prix Diesel/Essence,
consommations par défaut, mapping types GMAO) sont **les mêmes que `CalculateurPrixTrajetIA`**
pour que les deux services produisent des chiffres cohérents.

## 2. Pipeline d'optimisation (3 phases, §8.1)

```
POST /optimize
   │
   ├── Phase 1 — HEURISTIQUE GLOUTONNE (< 100 ms)
   │     missions triées par priorité puis heure de départ ;
   │     chaque mission reçoit la meilleure paire (véhicule, chauffeur) faisable
   │     → solution initiale faisable
   │
   ├── Phase 2 — ALGORITHME GÉNÉTIQUE (budget 1,5 s)
   │     population 40 · max 60 générations · sélection par tournoi (k=3)
   │     croisement uniforme + réparation · mutation 15% · élitisme 2
   │     chromosome = [gène par mission] = paire (véhicule, chauffeur) ou ∅
   │
   └── Phase 3 — RECHERCHE LOCALE type 2-opt (budget 0,8 s)
         replacement des missions non affectées + réaffectations unitaires
         tant que le score global s'améliore
   → Plan final + score + explications
```

Mesuré : **~470 ms** pour 5 missions / 4 véhicules / 4 chauffeurs (SLA fiche : < 2 s pour 100 missions).

## 3. Contraintes DURES (jamais violées — §5.1)

1. **Maintenance** — véhicule dont le kilométrage dépasserait le seuil de révision → exclu
   (les véhicules EN_MAINTENANCE/HORS_SERVICE sont déjà filtrés par `/vehicules/disponibles`)
2. **Classe de véhicule** — `requiredVehicleClass` (LIGHT_VEHICLE < VAN < FOURGON < HEAVY_TRUCK)
   doit être couverte (un CAMION peut servir une mission VAN, l'inverse non)
3. **Permis chauffeur** — hiérarchie A/B/BE/C/CE/D/E ↔ types GMAO (un permis B ne conduit pas un CAMION)
4. **Limite légale 10h/jour** — heures déjà travaillées (historique) + durée mission ≤ 10h
5. **Non-chevauchement horaire** — un chauffeur/véhicule occupe [départ, arrivée + pause 15 min] ;
   deux missions qui se chevauchent ne partagent jamais une ressource

## 4. Fonction objectif (§5.3 — contraintes SOUPLES)

```
Score = 0.40 × (1 − CoûtCarburant_normalisé)     ← privilégie les véhicules sobres
      + 0.30 × TauxAffectation_pondéré_priorité  ← HIGH/URGENT d'abord
      + 0.15 × 1/(1 + Var(heures_par_chauffeur)) ← équilibrage de la charge
      + 0.10 × (1 − TempsMort_pénalité)          ← minimise les gaps entre missions
      + 0.05 × Score_préférences                 ← adéquation permis/véhicule
```

- Une mission **non affectée est facturée à son pire coût carburant** (coût d'opportunité /
  sous-traitance) — sinon l'optimiseur « gagnerait » en abandonnant les missions chères.
- La charge chauffeur vient de l'historique 7 jours envoyé dans `recentMissions`
  (heures réelles si TERMINEE, sinon distance ÷ 75 km/h).

## 5. Explicabilité (§1.3)

Chaque affectation retourne :
- `assignmentConfidence` (0–1) : score de la paire choisie ÷ meilleure alternative
- `assignmentReasoning` (français) : consommation vs moyenne flotte, charge projetée vs
  moyenne équipe, compatibilité permis, classe requise
- `unassignedMissions[].reason` : `NO_FEASIBLE_VEHICLE` / `NO_FEASIBLE_DRIVER` /
  `DRIVER_HOURS_EXCEEDED` / `SCHEDULE_CONFLICT` + action suggérée
- `warnings` : chauffeur > 85% de la limite légale, véhicule proche du seuil de révision

## 6. API

### `GET /health`
```json
{ "status": "healthy", "service": "OptimisateurFlotteIA", "algorithm": "GREEDY+GA+LOCAL_SEARCH v1.0" }
```

### `POST /optimize`
Entrée (rassemblée par le backoffice depuis Mission.API / Fleet.API / IAM.API) :
```json
{
  "batchId": "batch-2026-07-06-0900",
  "missions":  [{ "missionId": 12, "villeDepart": "Tunis", "villeArrivee": "Sousse",
                  "distanceKm": 143, "dateDepart": "2026-07-06T08:00:00",
                  "requiredVehicleClass": "LIGHT_VEHICLE", "priorite": "HIGH" }],
  "vehicles":  [{ "idVehicule": 4, "immatriculation": "200 TU 1234", "typeVehicule": "BERLINE",
                  "typeCarburant": "DIESEL", "consommationMoyenne": 5.8, "kilometrage": 45000 }],
  "drivers":   [{ "idEmployee": 7, "nom": "Mohamed Ben Ali", "categoriePermis": "B" }],
  "recentMissions": [{ "employeeId": 7, "dateDepart": "...", "dateRetour": "...",
                       "distanceKm": 600, "statut": "TERMINEE" }]
}
```
Sortie : plan complet conforme §4 de la fiche (assignments, unassignedMissions, metrics, warnings).

## 7. Intégration bout-en-bout

```
Backoffice « Missions »
 ├─ Wizard « Nouvelle Mission » + switch « Affectation automatique par l'IA »
 │      → POST /api/missions sans vehiculeId/employeeId → statut EN_ATTENTE
 │
 ├─ Bouton « Optimiser le planning » (OptimizerPlanningModal)
 │      1. GET /api/missions            → missions EN_ATTENTE non affectées + historique 7j
 │      2. GET /api/vehicules/disponibles (Fleet.API)
 │      3. GET /api/employees?post=CHAUFFEUR&statut=DISPONIBLE (IAM.API)
 │      4. POST http://localhost:8001/optimize   ← CE SERVICE
 │      5. Affiche plan (score, confiance, raisons, warnings)
 │      6. « Appliquer le plan » → PUT /api/missions/{id}/assign par affectation
 │             → Mission.API : EN_ATTENTE → EN_COURS + véhicule/chauffeur enregistrés
```

Changements Mission.API associés :
- `Missions.EmployeeId` / `Missions.VehiculeId` désormais **nullables** (SQL idempotent au démarrage)
- `POST /api/missions` sans véhicule+chauffeur → mission `EN_ATTENTE`
- Nouveau `PUT /api/missions/{id}/assign` (rôles ADMIN/ADMINISTRATEUR/GESTIONNAIRE)

## 8. Lancer / tester

```bash
# Docker (recommandé)
docker compose up -d ai-optimizer          # http://localhost:8001/docs (Swagger)

# Local
cd OptimisateurFlotteIA
pip install -r requirements.txt
python main.py                             # port 8000

# Test du moteur (scénario fiche annexe A.1 + assertions)
python test_optimizer.py
```

## 9. Fichiers

| Fichier | Rôle (module fiche §7.2) |
|---|---|
| `main.py` | API FastAPI (`/health`, `/optimize`) + graceful degradation (§9.3) |
| `models.py` | Modèles Pydantic entrée/sortie (DataValidator) |
| `constraints.py` | ConstraintChecker — contraintes dures §5.1 |
| `scoring.py` | ScoringModule — fonction objectif §5.3 + coûts carburant |
| `optimizer.py` | OptimizationEngine (3 phases) + ExplanabilityGenerator |
| `test_optimizer.py` | Test de non-régression du moteur |

## 10. Limites v1 / évolutions prévues par la fiche

- **RabbitMQ event-driven** (§2.3) : la v1 est synchrone HTTP (même pattern que le prédicteur
  de prix) ; le passage aux topics `xpark.missions.ready-for-optimization` /
  `xpark.optimization.plan-generated` est prévu quand les autres services publieront ces événements.
- **Proximité géographique** (§5.2 batching) : nécessite la localisation temps réel des
  véhicules (GPS) — non disponible dans la base actuelle.
- **Google Maps Distance Matrix** (§8.2) : la distance vient de la matrice statique du
  prédicteur (stockée sur la mission à la création).
- **OR-Tools CP-SAT** : si les flottes dépassent ~500 missions/batch, remplacer le GA
  maison par `ortools` (déjà prévu §7.1).
