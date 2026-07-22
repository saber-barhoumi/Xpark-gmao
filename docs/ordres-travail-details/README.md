# Ordres de travail — page « Détails » (`/tasks/view-details`)

> Rôles : lecture pour tout utilisateur authentifié du back-office ;
> écriture (commentaires, pièces jointes) pour `ADMIN`, `GESTIONNAIRE`,
> `TECHNICIEN`.

## 1. Le problème

`/tasks/kanban` fonctionnait, `/tasks/view-details` non. Le diagnostic a montré
que **la page front était correcte** : ce sont les endpoints qu'elle appelle qui
n'existaient pas dans `OrdreTravailController`.

| Appel de `viewDetailsService` | Existait ? |
|---|---|
| `GET /ordres-travail/{id}/detail` | ❌ — seul `GET /{id}` existait |
| `POST /ordres-travail/{id}/commentaires` | ❌ |
| `POST /ordres-travail/{id}/attachments` | ❌ |

Chaque chargement partait donc en 404 → `catch` → **« Ordre de travail
introuvable »**, quel que soit l'`id`.

Deux défauts secondaires ont été trouvés au passage :

- l'entrée de menu **« Vue détaillée » pointe sur `/tasks/view-details` sans
  `?id=`** : la page affichait « ID manquant », donc l'entrée de menu était
  inutilisable (seule la navigation depuis une carte du kanban marchait) ;
- le **kanban renvoyait des valeurs factices** : `hasAttachments` codé en dur à
  `false`, et `commentsCount` valant en réalité le **nombre d'interventions**.
  C'est précisément l'incohérence Kanban ↔ Détails à corriger.

## 2. Ce qui existait déjà (et n'a donc pas été recréé)

Point important pour la suite : **aucune migration de base n'a été nécessaire**.

| Élément | État avant |
|---|---|
| Entités `Attachment` / `Commentaire` | ✅ présentes dans `Maintenance.Domain` |
| `DbSet<Attachment>` / `DbSet<Commentaire>` | ✅ déclarés dans `MaintenanceDbContext` |
| Navigations `OrdreTravail.Attachments/.Commentaires` | ✅ présentes |
| Tables PostgreSQL `Attachments` / `Commentaires` | ✅ existantes (`\dt`) |
| Couche API | ❌ **manquante — c'était tout le bug** |

## 3. Endpoints ajoutés

Tous dans `Maintenance.API/Controllers/OrdreTravailController.cs`, **sans
modifier une seule route existante**.

### `GET /api/ordres-travail/{id}/detail`

Retourne exactement la forme attendue par `OrdreDetail` du front :

```json
{ "id": 6, "titre": "OT-20260415-5694", "description": "…",
  "priorite": "BASSE", "statut": "PLANIFIE",
  "dateCreation": "…", "dateEcheance": "…",
  "technicien": "ADMIN Saber", "equipement": "123TUN4264",
  "tags": ["PREVENTIVE"],
  "attachments": [{ "id":1, "nom":"rapport.txt", "url":"/uploads/…",
                    "taille":26, "type":"text/plain", "createdAt":"…" }],
  "commentaires": [{ "id":1, "contenu":"…", "auteur":"ADMIN Saber",
                     "createdAt":"…" }] }
```

- `404` si l'OT n'existe pas, `401` sans jeton.
- `tags` : il n'existe **pas** de colonne `tags` en base. Plutôt que de renvoyer
  un tableau vide inutile ou d'inventer une table, on expose une donnée réelle
  et pertinente : les **types d'intervention** rattachés à l'OT
  (`PREVENTIVE` / `CURATIVE`).

### `POST /api/ordres-travail/{id}/commentaires`

Corps : `{ "contenu": "…" }`. L'auteur est **l'utilisateur authentifié**
(`ClaimTypes.NameIdentifier`), jamais une valeur envoyée par le client.
`400` si le contenu est vide, `404` si l'OT n'existe pas, `403` hors rôles.

### `POST /api/ordres-travail/{id}/attachments`

`multipart/form-data`, champ `file`. Suit **la convention déjà en place** dans
`PiecesRechangeController.UploadImage` :

- écriture dans `/app/wwwroot/uploads/ordres-travail`, monté depuis le volume
  partagé `./data/uploads` (déclaré pour `maintenance-api` dans le compose) ;
- nom de fichier **remplacé par un GUID** (le nom d'origine est conservé en base
  dans `Nom`) — évite les collisions et la traversée de chemin ;
- **liste blanche** d'extensions (images, PDF, Office, CSV, TXT) — un `.exe` est
  refusé en `400` ;
- taille maximale **20 Mo**.

## 4. Résolution des noms (décision d'architecture)

`Maintenance.Domain/Entities/Vehicule.cs` et `Utilisateur.cs` sont des **stubs
vides** portant le commentaire *« Cross-service reference — use FK only »* :
Maintenance ne projette délibérément **pas** ces agrégats, qui appartiennent à
Fleet et IAM.

Pour afficher malgré tout « technicien » et « équipement », on réutilise
**exactement le mécanisme déjà employé par `kanban/metadata`** : une lecture SQL
brute sur la base partagée (`ResoudreNomsUtilisateurs`, `ResoudreImmatriculations`).
Aucun nouveau couplage n'est introduit — c'est le pattern maison, factorisé en
deux helpers réutilisables.

## 5. Cohérence Kanban ↔ Détails

Le kanban renvoie désormais des chiffres **réels**, calculés en
**3 requêtes agrégées** (pas de N+1) :

| Champ | Avant | Après |
|---|---|---|
| `hasAttachments` | `false` en dur | `true` si l'OT a ≥ 1 pièce jointe |
| `commentsCount` | nb d'**interventions** | nb de **commentaires** |
| `hasSpareParts` | `false` en dur | `true` si une intervention a consommé une pièce |
| `tags` | `[]` en dur | types d'intervention réels |

Vérifié sur l'OT #6 : le kanban affiche `commentsCount=1, hasAttachments=true`,
et la page de détail liste bien 1 commentaire et 1 pièce jointe — **mêmes
chiffres des deux côtés**.

## 6. Corrections front

- **Sans `id`** : la page liste les ordres de travail et permet d'en ouvrir un
  (réutilise `ordreTravailService.getAll`, aucun endpoint supplémentaire).
  L'entrée de menu devient donc utilisable.
- **`id` inconnu** : message explicite + lien de retour vers la liste, au lieu
  d'une impasse.
- Les erreurs d'ajout de commentaire / téléversement ne sont plus avalées par un
  `console.error` silencieux.
- La navigation kanban → détail existait déjà (`TaskItem.tsx`) et est inchangée.

## 7. Vérifications effectuées

| Test | Résultat |
|---|---|
| `dotnet build` Maintenance | 0 erreur |
| `tsc --noEmit` back-office | 0 erreur |
| `GET {id}/detail` | 200 + immatriculation enrichie |
| `GET` id inexistant | 404 |
| sans jeton | 401 |
| rôle `CLIENT` sur les 2 écritures | **403** |
| commentaire vide | 400 |
| pièce jointe `.exe` | 400 |
| aller-retour commentaire + pièce jointe | présents dans `/detail` |
| cohérence kanban ↔ détail | chiffres identiques |
| 7 routes Maintenance existantes | toujours 200 |
| via le chemin réel `:3000` (slash final axios) | detail / commentaires / attachments / kanban → 200 |

## 8. Maintenir / étendre

- **Suppression** de commentaires ou de pièces jointes : non implémentée (le
  front ne l'expose pas). À ajouter le cas échéant en `DELETE
  {id}/commentaires/{cid}` avec contrôle « auteur ou ADMIN ».
- **Fichiers orphelins** : supprimer un OT retire ses lignes `Attachments` en
  cascade mais **pas** les fichiers du volume. Prévoir une tâche de purge si le
  volume grossit.
- **Ne pas** ajouter de colonne `tags` sans décider d'abord si les types
  d'intervention suffisent (voir §3).
