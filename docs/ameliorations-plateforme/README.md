# Améliorations plateforme XPARK — août 2026

Correction de 7 anomalies et ajout de fonctionnalités, réalisés sur la branche
`Saber`, un commit par sujet, chacun testé avant le suivant.

## Sommaire

| # | Sujet | Documentation | Commit |
|---|---|---|---|
| 1 | Facturation : ne facturer que les prestations livrées | [facturation-missions-eligibles.md](facturation-missions-eligibles.md) | `6aa848d` |
| 2 | Analyses : filtres métier, nouveaux graphiques, mise en page | [analytics-filtres-graphiques.md](analytics-filtres-graphiques.md) | `85d43b7` |
| 3 | Retrait du vocabulaire technique des écrans métier | [correctifs-interface.md](correctifs-interface.md#3--retrait-du-vocabulaire-technique) | `116f855` |
| 4 | Créer une mission pour un client depuis `/users` | [correctifs-interface.md](correctifs-interface.md#4--créer-une-mission-pour-un-client) | `0c135b8` |
| 5 | Annuaire clients dynamique | [correctifs-interface.md](correctifs-interface.md#5--annuaire-clients-dynamique) | `0c135b8` |
| 6 | Archivage intelligent des comptes | [archives-utilisateurs.md](archives-utilisateurs.md) | `65bbf9d` |
| 7 | Barre latérale : affichage incohérent | [correctifs-interface.md](correctifs-interface.md#7--barre-latérale) | `f1b7567` |

> **Seconde série de correctifs** (projets, tableaux analytiques, alertes,
> IBOA, historiques) : voir [correctifs-aout-2026.md](correctifs-aout-2026.md).

## Principes suivis

- **Réutiliser avant de créer.** Aucune logique métier dupliquée : la création
  de mission depuis l'annuaire réutilise l'assistant existant, la facturation
  s'appuie sur les endpoints Finance existants, l'annuaire agrège des services
  déjà en place.
- **L'API reste l'autorité.** Les règles critiques (anti-doublon de facture,
  archivage, purge) sont appliquées côté serveur, l'interface ne fait que les
  refléter.
- **Architecture inchangée.** Chaque ajout backend respecte le découpage en
  4 couches (API / Application / Domain / Infrastructure) du service concerné.
- **RBAC respecté.** Chaque nouvelle route et chaque nouvelle action vérifie
  le rôle, côté API comme côté interface.

## Bugs de fond découverts en cours de route

Trois anomalies n'étaient pas dans la liste initiale mais expliquaient les
symptômes observés :

1. **`vehiculeService.getAll()` renvoyait toujours une liste vide** — il lisait
   `response.data.data` alors que Fleet.API renvoie `{ total, page, pageSize,
   items }`. Conséquence : disponibilité de la flotte à 0 %, graphique « État
   de la flotte » masqué (c'était **le grand bloc vide** signalé au milieu des
   Analyses) et consommation par véhicule sans données.
2. **La création de mission ne transmettait aucun client** — une mission créée
   depuis le back-office n'était donc rattachée à personne, et par conséquent
   jamais facturable.
3. **Le contexte de mise en page supprimait les attributs de `<html>`** à chaque
   changement de réglage, ce qui cassait par intermittence la barre latérale.

## Vérification

Chaque sujet a été validé avant commit : compilation des microservices
concernés, `tsc` sans erreur, build de production, déploiement des conteneurs,
puis test réel (appels API de bout en bout et vérification dans le navigateur,
sans erreur console). Les données de test créées pendant les vérifications ont
été remises dans leur état initial.
