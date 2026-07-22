# PredictionPanne — Clean Architecture

> Microservice de **maintenance prédictive**. Port `5009`, préfixe passerelle
> `/prediction/`, page back-office `/maintenance/prediction-pannes`.
> Suit la recette commune du projet (voir `microservices/IAM/ARCHITECTURE.md`).

## 1. Objectif

Anticiper les défaillances **avant** qu'elles n'immobilisent un véhicule, à
partir des données que la GMAO possède déjà : kilométrage, âge, historique
d'interventions, coûts de maintenance.

## 2. Structure

```
microservices/PredictionPanne/
├── PredictionPanne.Domain
│   └── Entities/  Prediction (entité possédée) · Enums (NiveauRisque,
│                  TypePanne, SourcePrediction) · Refs (VehiculeRef,
│                  InterventionRef — projections LECTURE SEULE)
├── PredictionPanne.Application
│   ├── DTOs/         PredictionDto, SanteVehiculeDto, DashboardDto,
│   │                 VehiculeFeatures, PredictionCalculee
│   └── Interfaces/   IPredictionService (cas d'usage)
│                     IPredictionEngine  ← POINT D'INTÉGRATION IA
├── PredictionPanne.Infrastructure
│   ├── Data/       PredictionDbContext
│   ├── Engine/     OrganeClassifier · RuleBasedPredictionEngine
│   ├── Services/   PredictionService (orchestration)
│   └── DependencyInjection.cs
└── PredictionPanne.API
    └── Controllers/PredictionsController · Program.cs · Dockerfile
```

Le flux de dépendances respecte l'oignon : `API → Application → Domain`,
`Infrastructure → Application`. Le Domain ne référence que `XparkGMAO.Shared`.

## 3. Le point d'intégration du modèle IA

C'est la décision structurante du module.

```
PredictionService  ──dépend de──►  IPredictionEngine  (Application)
                                          ▲
                        ┌─────────────────┴─────────────────┐
                        │                                   │
            RuleBasedPredictionEngine            MlPredictionEngine
              (aujourd'hui, règles)              (demain, modèle entraîné)
```

`IPredictionEngine` ne connaît ni base de données, ni HTTP, ni contrôleur :

```csharp
public interface IPredictionEngine
{
    string Version { get; }
    IEnumerable<PredictionCalculee> Predire(VehiculeFeatures features);
}
```

**`VehiculeFeatures` est déjà un vecteur de caractéristiques** — âge,
kilométrage, nombre d'interventions, curatives, jours depuis la dernière
intervention, km depuis la dernière révision, coût cumulé, pannes récentes,
historique par organe. Il est sérialisable tel quel vers un service Python,
exactement comme `CalculateurPrixTrajetIA` et `OptimisateurFlotteIA` le font
déjà dans ce projet.

**Pour brancher un modèle entraîné :**

1. écrire `MlPredictionEngine : IPredictionEngine` dans Infrastructure — il
   POSTe `VehiculeFeatures` vers le service ML et désérialise la réponse en
   `PredictionCalculee` ;
2. changer **une seule ligne** dans `DependencyInjection.cs` ;
3. donner une `Version` distincte (ex. `xgboost-v1`).

Ni contrôleur, ni DTO d'API, ni schéma de base ne changent.

### Pourquoi des règles aujourd'hui, et pas un modèle

Honnêteté intellectuelle : **ce n'est pas un modèle appris**, et le module ne
le prétend jamais (chaque prédiction porte `source: REGLES` et
`versionModele: regles-v1`, affichés dans l'interface).

Deux raisons assumées :

- **il n'existe pas encore de jeu d'entraînement.** Un modèle supervisé exige
  un historique étiqueté « panne survenue / non survenue ». La table
  `PredictionsPanne` porte justement les colonnes `Realisee` et
  `DateVerification` : le module **construit** ce jeu de données au fil de son
  utilisation. C'est la condition préalable à un vrai modèle ;
- **l'explicabilité.** Un exploitant n'immobilise pas un camion sur un score
  opaque. Chaque prédiction expose une phrase vérifiable — « 47 000 km depuis
  la dernière intervention, soit 32 000 km au-delà de la périodicité de
  15 000 km ». Un modèle appris ne donne pas cela gratuitement.

## 4. Le moteur de règles

Quatre familles d'heuristiques, toutes calculées sur des données réelles :

| Règle | Signal | Sortie |
|---|---|---|
| **Usure par organe** | km parcourus vs km d'usure typique de l'organe | freins 60 000 km, pneus 70 000, embrayage 180 000, amortisseurs 120 000, refroidissement 150 000, distribution 250 000 |
| **Récurrence de pannes** | ≥ 2 interventions curatives sur 180 jours | fiabilité dégradée, diagnostic de cause racine |
| **Révision en retard** | km depuis dernière intervention > 15 000 | vidange + filtres sous 7 jours |
| **Fin de cycle** | > 340 000 km ou ≥ 15 ans | risque CRITIQUE, évaluer le remplacement |

Traitements transverses :

- **score de confiance** proportionnel à la richesse de l'historique, plafonné
  à 0,9 — des règles ne sont jamais certaines ;
- **niveau de risque** dérivé de la probabilité (≥ 0,80 CRITIQUE, ≥ 0,60 ÉLEVÉ,
  ≥ 0,40 MODÉRÉ, sinon FAIBLE) ;
- **déduplication par organe** : seule la prédiction la plus probable est
  gardée pour un organe donné — deux alertes sur le même organe n'aident pas à
  décider ;
- **date de maintenance recommandée** placée à 80 % du délai restant : tout
  l'objet du module est d'agir *avant*.

### `OrganeClassifier`

La GMAO ne stocke pas d'organe structuré : les techniciens saisissent du texte
libre. Ce classifieur par mots-clés (insensible aux accents et à la casse)
transforme cet historique en signal exploitable. Il est isolé pour pouvoir être
remplacé par un classifieur entraîné sans toucher au moteur.

## 5. Score de santé

`100 − Σ(pénalité(risque) × probabilité)`, borné à [0, 100] :
CRITIQUE 30, ÉLEVÉ 18, MODÉRÉ 8, FAIBLE 3.

Un véhicule sans prédiction vaut 100, ce qui se lit **« aucun signal détecté »**
et non « garanti sans panne » — nuance importante.

## 6. API et RBAC

Rôles réels du système : `CLIENT(1) · CHAUFFEUR(2) · TECHNICIEN(3) ·
GESTIONNAIRE(4) · ADMINISTRATEUR(5) · ADMIN(6)`.

| Endpoint | Méthode | Rôles |
|---|---|---|
| `/api/predictions/dashboard` | GET | ADMIN, ADMINISTRATEUR, GESTIONNAIRE, TECHNICIEN |
| `/api/predictions/sante` | GET | idem |
| `/api/predictions/sante/{vehiculeId}` | GET | idem (404 si inconnu) |
| `/api/predictions/historique/{vehiculeId}` | GET | idem |
| `/api/predictions/recalculer` | POST | **ADMIN, ADMINISTRATEUR, GESTIONNAIRE** |

Justifications :

- le **TECHNICIEN** lit : c'est lui qui exécute la maintenance prédite ;
- le recalcul est **réservé aux rôles de pilotage** : il réécrit les prédictions
  du jour ;
- **CLIENT et CHAUFFEUR sont exclus** — ce sont des données internes
  d'exploitation ; un client n'a pas à connaître l'état d'usure de la flotte.

Le front applique exactement les mêmes règles (route `allowedRoles`, bouton de
recalcul masqué), mais **l'API reste l'autorité** : vérifié à 403.

## 7. Base de données

Une seule table possédée, `PredictionsPanne`, créée en **SQL brut idempotent**
au démarrage — convention du projet (aucun service n'utilise les migrations EF).

`Vehicules` et `Interventions` sont **lues** via des projections marquées
`SetIsTableExcludedFromMigrations(true)` : ce service ne les écrit jamais.

**Idempotence quotidienne** : `RecalculerAsync` supprime les prédictions du jour
avant d'en générer de nouvelles. Deux clics sur « Relancer l'analyse » ne
créent pas de doublons (vérifié : 17 lignes après 2 exécutions, pas 34).
L'historique des jours précédents est conservé.

## 8. Vérifications effectuées

| Test | Résultat |
|---|---|
| `dotnet build` (4 couches) | 0 erreur |
| `tsc --noEmit` + `vite build` | 0 erreur |
| `/health` | healthy |
| Création de table au démarrage | idempotente |
| Recalcul sur le parc réel | 13 véhicules, 17 prédictions |
| Dashboard | score moyen 81/100, 4 véhicules à risque |
| Sans jeton | 401 |
| Rôle CLIENT (5 routes) | **403** |
| Véhicule inconnu | 404 |
| Double recalcul | 17 lignes (pas 34) |
| Via le chemin réel `:3000` | 4 GET + POST → 200 |

## 9. Maintenir / étendre

- **Ajuster les seuils** : constantes nommées en tête de
  `RuleBasedPredictionEngine` (`KmRevision`, `UsureOrganes`…). Les modifier ne
  demande aucun changement ailleurs.
- **Ajouter un organe** : une entrée dans `TypePanne`, une dans `UsureOrganes`,
  des mots-clés dans `OrganeClassifier`.
- **Boucle d'apprentissage** : renseigner `Realisee` / `DateVerification`
  lorsqu'une panne survient (ou non) constituera le jeu étiqueté nécessaire au
  modèle. C'est le prochain jalon naturel du module.
- **Rappel infra** : toute nouvelle route doit être déclarée dans
  `frontend/backoffice/nginx.conf`, et **la passerelle nginx doit être
  redémarrée** après modification de sa configuration (le volume monté ne
  déclenche pas de rechargement automatique).
