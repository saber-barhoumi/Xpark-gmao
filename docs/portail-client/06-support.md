# 🎫 Support — `/account/support`

## Ce que voit le client

- **Ouvrir un ticket** : sujet, catégorie (Mission / Facturation / Technique / Autre),
  mission liée (optionnelle, liste de SES missions), message.
- **Mes tickets** : statut (Ouvert / En cours / Résolu / Fermé), **réponse du support**
  mise en évidence, bouton « Marquer comme résolu / fermer », tickets fermés repliés.
- Coordonnées d'urgence (+216 70 000 000, contact@xpark.tn).

## Comment c'est fait

### Fichiers

| Fichier | Rôle |
|---|---|
| `microservices/Mission.API/Entities/SupportTicket.cs` | **Nouveau** — entité ticket |
| `microservices/Mission.API/Data/MissionDbContext.cs` | DbSet + mapping `SupportTickets` |
| `microservices/Mission.API/Program.cs` | `CREATE TABLE IF NOT EXISTS "SupportTickets"` (idempotent, au démarrage) |
| `microservices/Mission.API/Controllers/SupportController.cs` | **Nouveau** — API client + staff |
| `frontend/frontoffice/lib/supportService.js` | **Nouveau** — appels API |
| `frontend/frontoffice/app/account/support/page.js` | Page (formulaire + liste) |

### Modèle de données (`SupportTickets`)

| Colonne | Rôle |
|---|---|
| `ClientIdUtilisateur` (+ index) | Propriétaire — claim `userId` du JWT |
| `ClientNom` | Dénormalisé pour l'affichage backoffice |
| `Sujet`, `Categorie`, `Message` | Contenu du ticket (catégories validées côté serveur) |
| `Statut` | `OUVERT → EN_COURS → RESOLU / FERME` |
| `Reponse` | Réponse du staff, affichée au client |
| `MissionId` | Mission liée — **vérifiée** : doit appartenir au client |
| `DateCreation`, `DateMaj` | Suivi temporel (TIMESTAMPTZ, UTC) |

La table est créée par le **pattern SQL idempotent** déjà utilisé dans le projet
(mêmes garanties que les colonnes `VehiculeImmatriculation`, etc.) : aucun outil de
migration à exécuter, le service crée la table à son premier démarrage.

### API `/api/support` (JWT obligatoire)

| Méthode | Route | Qui | Rôle |
|---|---|---|---|
| GET | `/my` | Client | Ses tickets, plus récents d'abord |
| POST | `/` | Client | Créer (sujet/message requis, catégorie validée, mission vérifiée) |
| PUT | `/my/{id}/close` | Client | Fermer SON ticket |
| GET | `/?statut=` | Staff (ADMIN/GESTIONNAIRE) | Tous les tickets, filtre statut |
| PUT | `/{id}/respond` | Staff | Répondre + changer le statut |

Sécurité : chaque route client filtre par `ClientIdUtilisateur == CurrentUserId`
(claim JWT) — impossible de voir ou fermer le ticket d'un autre client.

## Comment tester

```bash
docker compose build mission-api && docker compose up -d mission-api
```
1. `/account/support` → créer un ticket (avec ou sans mission liée) → il apparaît « Ouvert ».
2. En staff : `PUT /api/support/{id}/respond` `{ "reponse": "…", "statut": "RESOLU" }`
   (Swagger `:5003/swagger`) → la réponse s'affiche chez le client.
3. Client : « Marquer comme résolu / fermer » → ticket dans la section repliée « fermés ».
