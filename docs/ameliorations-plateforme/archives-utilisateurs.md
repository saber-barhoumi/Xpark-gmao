# Archivage intelligent des comptes

Page : `/users/archives` · Commit `65bbf9d`

## Ce qui a changé

Supprimer un compte lié à des données échouait avec un message invitant à le
suspendre. Il existe désormais une **suppression intelligente** :

- compte porteur d'un **historique métier** → **archivé** (retiré des écrans
  actifs, relations intactes, **restaurable**) ;
- compte sans **aucune** trace métier → **supprimé définitivement**.

Vaut pour **tous les rôles** (client, chauffeur, gestionnaire, administrateur,
technicien) et pour les rôles futurs, sans modification de code.

## Pourquoi

L'historique appartient à l'entreprise, pas au compte. Effacer un chauffeur
effacerait la traçabilité de ses missions, et une facture doit rester
rattachable à son client des années après. À l'inverse, garder indéfiniment un
compte créé par erreur n'a aucun intérêt.

## Comment ça marche

### Détection des dépendances

Le service interroge **24 tables métier** de la base partagée par des `COUNT`
ciblés : missions (client **et** chauffeur), factures, devis, réservations,
demandes de service, demandes de transport, tickets de support, interventions,
ordres de travail et leur historique, inspections/mouvements/notes
d'équipements, commentaires, alertes, notifications, conversations et
participations, réactions aux messages, tableaux de bord, trajets calculés,
événements de calendrier.

Deux choix de conception importants :

1. **Les tables purement techniques sont exclues** (journaux d'authentification,
   historique de connexion, OTP e-mail, réglages MFA, statuts). Elles n'ont
   aucune valeur d'historique : un compte qui s'est seulement connecté doit
   pouvoir être supprimé. Elles sont purgées avec le compte.
2. **Les `COUNT` sont tolérants** : une table absente (module non déployé,
   schéma antérieur) compte 0 au lieu de faire échouer l'opération. Le service
   survit donc à l'évolution du schéma.

### Cycle de vie

```
compte actif ──DELETE──> [historique ?]
                          │
              oui ────────┴──────── non
               │                     │
           ARCHIVÉ              SUPPRIMÉ définitivement
               │                (+ purge des données techniques)
       ┌───────┴────────┐
   restaurer          purger
       │                │
   SUSPENDU        refusé si historique (409)
  (à réactiver)
```

La restauration repasse le compte en **SUSPENDU**, pas en ACTIF : un
administrateur le relit et le réactive explicitement. On ne rend pas l'accès
automatiquement à un compte qui avait été retiré.

## Fichiers

**Microservice IAM** (Clean Architecture)
- `XparkGMAO.Shared/Enums/SharedEnums.cs` — `StatutUtilisateur.ARCHIVE`
- `IAM.Application/DTOs/ArchiveDtos.cs` — DTO de dépendances, résultat, ligne d'archive
- `IAM.Application/Interfaces/IUserArchiveService.cs` — contrat
- `IAM.Infrastructure/Services/UserArchiveService.cs` — détection, archivage, restauration, purge
- `IAM.Infrastructure/Services/UserService.cs` — `GetAllUsersAsync` exclut les archivés
- `IAM.Infrastructure/DependencyInjection.cs` — enregistrement
- `IAM.API/Controllers/UserManagementController.cs` — endpoints

**Front-office**
- `app/(admin)/users/archives/page.tsx` — module Archives
- `app/(admin)/users/page.tsx` — la suppression annonce archivage ou suppression
- `services/userService.ts` — méthodes et types
- `routes/index.ts`, `assets/data/menu-items.ts` — route et entrée de menu

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| `DELETE` | `/api/user-management/{id}` | Suppression intelligente (archive ou supprime) |
| `GET` | `/api/user-management/{id}/dependencies` | Données métier rattachées |
| `GET` | `/api/user-management/archives` | Comptes archivés + volume conservé |
| `POST` | `/api/user-management/archives/{id}/restore` | Restauration (→ SUSPENDU) |
| `DELETE` | `/api/user-management/archives/{id}` | Purge — **409** si historique |

Tous sous `[Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]` ; la page
Archives est restreinte à ADMIN/ADMINISTRATEUR côté routage.

## Base de données

Aucune migration. Seule la valeur `ARCHIVE` s'ajoute à l'énumération de statut,
stockée en texte dans la colonne existante `Utilisateurs.Statut`.

## Tester manuellement

1. **Compte avec historique** — `/users`, supprimer un client ayant des
   missions : la confirmation annonce « Archiver ce compte ? » et **détaille**
   les données concernées. Après validation : « Compte archivé : N donnée(s)
   métier conservée(s) », et le compte disparaît de la liste.
2. **Archives** — Administration › Utilisateurs › Archives : le compte y figure
   avec son rôle, ses dates et « N donnée(s) » conservées. Recherche et filtre
   par rôle disponibles.
3. **Purge refusée** — le bouton de suppression définitive est désactivé tant
   qu'il reste de l'historique (et l'API répond 409 si on force).
4. **Restauration** — le compte revient dans `/users` en **SUSPENDU** ;
   le réactiver pour rétablir l'accès. Vérifier que ses missions/factures
   sont toujours là.
5. **Compte sans historique** — la confirmation annonce une suppression
   définitive et le compte disparaît réellement.

Vérification effectuée : dépendances du client #37 = 7 (3 missions, 3 demandes
de transport, 1 facture) ; suppression du compte #44 → archivé (21 → 20 comptes
actifs) ; purge refusée en 409 ; restauration → SUSPENDU avec ses 3 références
intactes.

## Limites et suites possibles

- La date d'archivage réutilise `DateModification` : elle est écrasée si le
  compte est modifié après archivage. Une colonne dédiée serait plus précise.
- Pas de purge automatique après un délai légal (RGPD) : tout est manuel.
- Aucune trace de « qui a archivé » : à ajouter dans le journal d'audit.
- Les comptes archivés restent comptés dans certaines statistiques calculées à
  partir des données métier (leurs missions existent toujours) — c'est voulu,
  mais à garder en tête.
