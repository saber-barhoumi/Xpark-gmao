# Facturation — ne facturer que les prestations livrées

Page : `/invoices/create-invoice` · Commit `6aa848d`

## Ce qui a changé

Avant, le sélecteur proposait **tous** les comptes clients, la mission était
facultative, et rien n'empêchait de facturer **deux fois la même mission**.

Désormais l'écran part des **missions facturables** et n'expose que les clients
qui en ont au moins une.

## Pourquoi

Une facture doit correspondre à une prestation réellement livrée et non encore
facturée. Proposer un client sans rien à facturer fait perdre du temps ; pouvoir
facturer deux fois la même mission est une erreur comptable.

## Comment ça marche

**Mission facturable** = statut `TERMINEE` **et** rattachée à un client **et**
absente de la liste des missions déjà facturées.

1. Le formulaire charge les comptes, les missions et les identifiants des
   missions déjà facturées.
2. La liste des clients est réduite à ceux ayant ≥ 1 mission facturable
   (avec le compteur affiché).
3. Choisir une mission pré-remplit **montant** (coût de la mission) et
   **description**, et affiche un récapitulatif (trajet, distance, véhicule,
   chauffeur).
4. La TVA (19 % par défaut) et le total TTC se recalculent en direct.
5. À l'enregistrement, le serveur revérifie l'unicité.

**Une facture annulée ne compte pas** : la mission redevient facturable, ce qui
est précisément l'usage de l'annulation (une facture ne se supprime pas).

## Fichiers modifiés

**Microservice Finance** (Clean Architecture)
- `Finance.Application/Interfaces/IFacturationService.cs` — `GetMissionsFactureesAsync()`
- `Finance.Infrastructure/Services/FacturationService.cs` — implémentation + garde anti-doublon dans `CreateAsync`
- `Finance.API/Controllers/FacturesController.cs` — nouvel endpoint + gestion du conflit

**Front-office d'administration**
- `services/factureService.ts` — `getMissionsFacturees()`
- `app/(admin)/invoices/create-invoice/page.tsx` — refonte du flux

## Endpoints

| Méthode | Route | Rôles | Description |
|---|---|---|---|
| `GET` | `/api/factures/missions-facturees` | ADMIN, ADMINISTRATEUR, GESTIONNAIRE | Ids des missions déjà facturées (factures non annulées) |
| `POST` | `/api/factures` | ADMIN, GESTIONNAIRE | Création — renvoie **409** si la mission est déjà facturée |

## Base de données

Aucune migration : le champ `MissionId` existait déjà sur `Factures`. La règle
d'unicité est appliquée par le service (une contrainte SQL unique serait
inadaptée car elle interdirait aussi de refacturer après annulation).

## Tester manuellement

1. `/invoices/create-invoice` : seuls les clients ayant des missions livrées non
   facturées apparaissent, avec leur nombre.
2. Choisir un client puis une mission → montant et description se remplissent,
   le récapitulatif s'affiche, le TTC se calcule.
3. Créer la facture → redirection vers le document imprimable.
4. Revenir sur l'écran : la mission facturée **n'est plus proposée** ; si le
   client n'en avait qu'une, il disparaît de la liste.
5. Quand tout est facturé, l'écran affiche « Tout est facturé 🎉 ».
6. Annuler la facture depuis la liste → la mission redevient facturable.

Vérification effectuée : création `201`, doublon `409` (« La mission #23 est
déjà facturée… »), annulation `200`, puis mission de nouveau facturable.

## Limites et suites possibles

- Une facture couvre **une** mission. Le regroupement de plusieurs missions sur
  une facture mensuelle par client reste à faire.
- Le montant reprend le coût de la mission et reste modifiable : aucune grille
  tarifaire contractuelle n'est appliquée automatiquement.
