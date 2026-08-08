# Jeu de données de démonstration

Sert à remplir l'application de contenu présentable avant de prendre les
captures d'écran du rapport de fin d'études.

## Lancement

```bash
docker exec -i xpark-postgres psql -U xpark_user -d xpark_gmao < database/seed-demo.sql
```

Le script est **idempotent** : il se termine par un tableau de contrôle et
peut être rejoué autant de fois que nécessaire sans créer de doublon.

## Ce qu'il fait

| Section | Contenu |
|---|---|
| 0 | Purge de la tranche d'identifiants 500-999 |
| 1 | Utilisateurs, employés, présence messagerie |
| 2 | Flotte de 16 véhicules |
| 3 | Équipements, pièces de rechange, sources de carburant |
| 4 | Demandes de transport, devis, missions, traces GPS, tickets, pleins, documents, assurances |
| 5 | Ordres de travail, historique des statuts, interventions, pièces consommées |
| 6 | Factures, alertes, conversations et messages |
| 7 | Resynchronisation des séquences d'identité |

## Volumétrie obtenue

| Module | Lignes | Dont |
|---|---|---|
| Utilisateurs | 42 | 4 en attente, 15 archivés, 23 actifs |
| Véhicules | 16 | tous avec photo |
| Équipements | 14 | tous avec image |
| Pièces de rechange | 18 | 3 sous le seuil minimum |
| Demandes de transport | 17 | les 5 statuts du workflow |
| Devis | 6 | accepté, envoyé, refusé, expiré |
| Missions | 32 | 4 en cours, en attente, terminées, annulées |
| Positions GPS | 69 | 4 traces de missions en cours |
| Ordres de travail | 17 | 8 planifiés, 4 en cours, 4 terminés, 1 annulé |
| Interventions | 18 | préventives et curatives |
| Factures | 17 | les 5 statuts |
| Alertes | 46 | des 4 priorités, dont 3 critiques |
| Conversations | 12 | 2 groupes de travail, 1 privée, 1 suivi client |
| Messages | 47 | dont 2 pièces jointes et 3 messages épinglés |

## Principes retenus

**Les lignes antérieures ne sont jamais supprimées.** Les identifiants
inférieurs à 500 portent l'historique réel des tests (journaux de connexion,
audit). Ils sont corrigés en place ou archivés, jamais détruits.

**Corrections apportées à l'existant.** Le jeu d'origine comportait des
incohérences qui auraient été visibles sur les captures :

- couples marque/modèle impossibles : « Toyota Grosses », « Peugeot Kangoo »,
  « Volkswagen Kangoo », « Mercedes Partner » ;
- une immatriculation invalide (« 120 ») et des formats mélangés ;
- des kilométrages absurdes (9 km sur un camion) ;
- des noms d'équipement de saisie de test (« esdssssssss », « sad ») et une
  `ImageUrl` pointant vers un article de blog ;
- sept factures portant toutes le même montant (1011,500) ;
- treize comptes de test (« brh Saber » ×4, « MFA Test » ×3, « Portail Demo »,
  « Client Test »…), désormais archivés.

**Aucun mot de passe en clair.** Les comptes créés reprennent l'empreinte du
compte d'identifiant 1 : ils partagent donc son mot de passe. Le script ne
contient ni mot de passe ni empreinte codée en dur.

**Aucune photographie de personne.** Les avatars sont des monogrammes générés,
convention habituelle des back-offices. Cela évite toute question de droit à
l'image dans un document soutenu.

**Immatriculations au format tunisien** `NNN TU NNNN`, numéros de châssis à
17 caractères, montants en dinars, TVA à 19 %, villes et coordonnées GPS
réelles (Tunis, Sfax, Sousse, Gabès, Monastir, Nabeul, Kairouan, Djerba).

## Visuels générés

Placés sous `data/uploads/`, servis par nginx sur `/uploads/` :

| Dossier | Nombre | Contenu |
|---|---|---|
| `avatars/` | 29 | monogrammes couleur, 256 × 256 px |
| `vehicules/` | 16 | silhouettes à plat avec marque, modèle et plaque |
| `equipements/` | 14 | vignettes avec pictogramme de catégorie |

Le script de génération est `database/generer-visuels-demo.py`.

## Points de vigilance

- Le seed écrit directement en base : il **contourne les règles métier et la
  publication d'événements**. Les journaux IBOA et les alertes calculées par le
  service Alerts ne sont donc pas régénérés automatiquement ; les alertes
  présentes ont été écrites explicitement.
- **Les enums ne sont pas tous partages.** Le service Alerts declare son
  propre `TypeAlerte` (41 valeurs) qui differe de celui de `XparkGMAO.Shared` :
  il ignore `KILOMETRAGE_REVISON` et attend `KILOMETRAGE_MAINTENANCE`. Ecrire
  une valeur de l'enum partage fait echouer la lecture EF Core avec un 409.
  Les valeurs a respecter sont celles de la couche `Domain` du service
  proprietaire de la table, pas celles du projet partage.
- `TypePeriodicite` est plafonné à 10 caractères en base : la valeur utilisée
  est `KM`.
- La colonne `Interventions.Cout` est `NOT NULL` : les interventions non
  terminées portent un coût de 0 et non `NULL`.
