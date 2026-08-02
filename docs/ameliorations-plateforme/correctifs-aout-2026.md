# Correctifs et évolutions — seconde série (août 2026)

Huit sujets traités sur la branche `Saber`, un commit par sujet, chacun testé
avant le suivant. Complète les [améliorations précédentes](README.md).

| # | Sujet | Commit |
|---|---|---|
| 1 | Projets : vocabulaire métier | `e5d4e63` |
| 2 | Projets : statistiques et équipes réelles | `e5d4e63` |
| 3 | Analyses : tableaux de données détaillées | `1b1cc79` |
| 4 | Sécurité : gestion de l'historique des connexions | `99b877d` |
| 5 | Alertes : 7 contrôles métier supplémentaires | `2759dff` |
| 6 | IBOA : langage métier et rapport d'exploitation | `b62c989` |
| 7 | Doublon de menu « Analyses » | `e5d4e63` |
| 8 | Prédiction de pannes : gestion de l'historique | `99b877d` |

---

## 1 & 2 — Projets : programmes d'exploitation réels

**Avant.** Catalogue figé aux noms d'ingénierie logicielle (« Migration Clean
Architecture », « Back-End », « Suppression en masse RGPD »), chiffres inventés
(34/34 tâches, 51 commentaires) et équipes tirées d'avatars de démonstration.

**Après.** Un projet est un **programme d'exploitation** de la société de
transport, entièrement **mesuré sur les données réelles** :

| Programme | Ce qui est mesuré |
|---|---|
| Conformité documentaire du parc | échéances encore valides |
| Plan de maintenance préventive | interventions préventives réalisées |
| Traitement des ordres de travail | ordres de travail clôturés |
| Affectation des missions | missions dotées d'un chauffeur et d'un véhicule |
| Réalisation des transports | missions livrées |
| Recouvrement des factures | factures encaissées |
| Développement du portefeuille | clients ayant commandé |
| Disponibilité de la flotte | véhicules disponibles |
| Suivi GPS des transports | missions rattachées à un véhicule suivi |

Chaque carte affiche **ce qu'elle mesure** (au lieu d'un « Tâches » abstrait),
un second indicateur réel (échéances dépassées, factures en retard…) et un
avancement calculé. Le statut est **déduit** de l'avancement. Un programme sans
donnée mesurable n'est pas affiché plutôt que d'afficher « 0/0 ».

**Équipes** : vrais comptes utilisateurs (nom, rôle, photo réelle si présente,
initiales sinon), sélectionnés selon les rôles utiles au programme.

**Fichiers** : `services/projectService.ts` (réécrit), `apps/Projects/page.tsx`,
`components/{Projects,ProjectDetails,Head}.tsx`.

**Au passage** : le tri reposait sur des champs supprimés (`dueDate`,
`startDate`) et **aurait planté à l'exécution** ; il porte désormais sur
l'avancement et le volume restant.

**Tester** : `/apps/Projects` → noms logistiques, aucun terme technique,
chiffres correspondant aux autres écrans (échéances, interventions, factures),
équipes affichant de vrais utilisateurs au survol.

---

## 3 — Analyses : tableaux de données détaillées

**Pourquoi.** Un graphique donne la tendance mais ne permet ni de lire une
valeur précise ni de retrouver une ligne.

**Ajouté.** Section « Données détaillées » avec 7 tableaux : missions,
performance des chauffeurs, performance des véhicules, parc de véhicules,
clients (revenus et panier moyen), interventions de maintenance, consommation
carburant (coût aux 100 km).

Composant réutilisable **`DataTable`** : recherche libre, tri par colonne avec
indicateur de sens, filtre par liste, pagination et état vide. Les colonnes
triables déclarent une **fonction de valeur** : le tri porte sur la donnée
brute et non sur le texte affiché (les distances se trient numériquement).

Les tableaux couvrent le **même périmètre que les filtres** : filtrer sur un
client réduit graphiques *et* tableaux. Le contenu financier suit le RBAC. Les
contrôles de recherche et de pagination sont exclus de l'impression du rapport.

**Fichiers** : `analytics/DataTable.tsx`, `analytics/AnalyticsTables.tsx`,
`AnalyticsDashboard.tsx`.

**Tester** : `/analytics`, descendre sous les graphiques ; trier « Distance »,
rechercher une ville, changer de page ; vérifier qu'un filtre en haut de page
réduit aussi les tableaux.

---

## 4 & 8 — Gestion des historiques

Même besoin sur deux écrans : consulter ne suffisait pas, il fallait pouvoir
faire le ménage.

### Sécurité (`/security`)

Sélection unitaire, multiple et « tout », suppression de la sélection,
suppression totale, filtre par résultat (réussies / échecs) et recherche (IP,
méthode, MFA, appareil, motif, date). L'historique chargé passe de 20 à
**200 entrées** : filtrer et purger n'a de sens que sur l'historique complet.
Réutilise les endpoints `DELETE /auth/security/login-history` existants.

### Prédiction de pannes (`/maintenance/prediction-pannes`)

Nouveau composant `HistoriqueAlertes` : tableau des prédictions **réellement
persistées**, sélection, suppression (sélection ou totalité), filtres par
niveau de risque et par organe, recherche, pagination.

**Nouveaux endpoints** (PredictionPanne) :

| Méthode | Route | Rôles |
|---|---|---|
| `GET` | `/api/predictions/historique` | authentifié |
| `DELETE` | `/api/predictions/historique/{id}` | ADMIN, ADMINISTRATEUR, GESTIONNAIRE |
| `POST` | `/api/predictions/historique/supprimer` | idem — corps vide = purge complète |

La suppression est sans risque : « Recalculer » régénère les prédictions.

**Détail d'implémentation** : la case « tout sélectionner » porte sur les
lignes **visibles après filtrage**, avec état indéterminé — on ne supprime
jamais une ligne masquée par un filtre.

**Tester** : cocher quelques lignes → « Supprimer (n) » ; filtrer puis « tout
sélectionner » et vérifier que seules les lignes visibles sont prises ; sur les
prédictions, « Tout vider » puis « Recalculer » régénère l'historique.

---

## 5 — Alertes : hub central de notifications

**Audit.** Le service ne couvrait que 8 contrôles (permis, factures échues,
missions sans affectation, assurance, vignette, visite technique, kilométrage,
mise en retard). Des pans entiers de l'exploitation ne remontaient rien.

**7 contrôles ajoutés**, sur le même principe que l'existant (lecture de la
base partagée, alerte créée seulement si aucune alerte ACTIVE ne couvre déjà le
sujet — donc pas de doublon jour après jour) :

1. **Demandes de transport sans devis** depuis plus de 24 h (priorité accrue à 3 jours)
2. **Missions livrées non facturées** — chiffre d'affaires qui dort, le contrôle le plus rentable
3. **Véhicules hors service** — capacité de transport perdue
4. **Stock de pièces** sous le minimum, avec distinction rupture / stock faible
5. **Équipements** hors service ou à remplacer
6. **Comptes en attente de validation** (clients comme employés)
7. **Prédictions de panne CRITIQUES** des 7 derniers jours

**Trois pièges de schéma** traités en vérifiant la base réelle plutôt qu'en
supposant :

- `PiecesRechange` expose `StockActuel` / `StockMinimum`, pas
  `QuantiteStock` / `SeuilAlerte` ;
- la table du module prédictif est **`PredictionsPanne` au singulier**
  (`PredictionsPannes` est une ancienne table vide) ;
- `Utilisateurs.Statut` est stocké en **entier**, pas en texte — la comparaison
  à la chaîne faisait échouer le contrôle en 500.

**Résultat mesuré** : `POST /api/alertes/run-checks` passe de 500 à 200, les
alertes passent de 11 à 30 et couvrent 10 types.

**Tester** : déclencher les contrôles (bouton de la page Alertes ou
`POST /api/alertes/run-checks`), puis vérifier `/alertes`.

**Limites** : ces contrôles sont **périodiques** (lecture d'état), pas
événementiels. Les alertes « au fil de l'eau » (mission créée à l'instant,
paiement reçu, GPS perdu en direct) demanderaient de publier un événement
depuis chaque microservice concerné — évolution possible, non couverte ici.

---

## 6 — IBOA : langage métier

**Avant.** Écran destiné aux gestionnaires mais affichant
`xpark.optimization.plan-generated`, `internal`, `LOW`, `INFO`, un score de
criticité, et au dépliage le contenu brut (`batchId`, `optimizationId`,
`executionTimeMs`).

**Après.** Couche de traduction `businessLabels.ts` :

- chaque type d'événement devient un intitulé compréhensible (« Plan
  d'affectation généré », « Nouvelle demande de transport », « Panne de véhicule
  signalée »…) avec icône et couleur ;
- `LOW`/`HIGH` → Faible / Élevée ; `INFO`/`NORMAL`/`IMPORTANT`/`CRITIQUE` →
  Pour information / À suivre / Important / Traitement immédiat ;
  `internal`, `MissionService`… → Assistant d'exploitation, Missions, Parc de véhicules ;
- un type **inconnu** retombe sur un libellé lisible déduit de son nom : un
  nouvel événement ajouté côté serveur reste compréhensible sans modifier la table.

Le dépliage affiche un **rapport d'exploitation** : ce qui s'est passé,
pourquoi, la conséquence, l'action recommandée, la date, la gravité, la
priorité, l'origine, puis les seules références utiles extraites du contenu
(mission, véhicule, immatriculation, chauffeur, client, trajet, montant, motif).
Les champs d'implémentation ne sont plus montrés.

**Tester** : `/monitoring/iboa`, déplier un événement → rapport structuré, plus
aucun identifiant technique (les « xpark. » restants sont des adresses e-mail).

---

## 7 — Doublon de menu

« Analyses & KPIs » figurait **à la fois** dans la section ANALYSES du menu et
dans l'encart « Intelligence Artificielle » de la barre latérale. L'encart ne
conserve que son action propre (« Générer un rapport ») ; la navigation reste
assurée par le menu.

---

## Vérification d'ensemble

Après les 8 sujets : suite de non-régression **27 contrôles OK / 0 échec**
(8 services en santé, RBAC, 13 endpoints métier existants, 4 nouveautés),
`tsc` sans erreur, builds de production réussis, pages vérifiées dans le
navigateur sans erreur console.
