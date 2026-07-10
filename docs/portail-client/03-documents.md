# 📄 Documents — `/account/documents`

## Ce que voit le client

- Des **filtres** : Tous / 📋 Ordres de mission / ✅ Attestations / 🧾 Factures (avec compteurs).
- La **liste de ses documents**, générés automatiquement depuis ses données :
  - **Ordre de mission** (`OM-00012`) — pour chaque mission non annulée ;
  - **Attestation de transport** (`AT-00012`) — pour chaque mission terminée ;
  - **Facture** (`FA-00003` ou n° réel) — pour chaque facture émise.
- Bouton **⬇️ Ouvrir / PDF** : le document s'ouvre en vue imprimable → « Enregistrer
  au format PDF » dans la boîte d'impression du navigateur.

## Comment c'est fait

### Fichiers

| Fichier | Rôle |
|---|---|
| `frontend/frontoffice/app/account/documents/page.js` | Page : catalogue + filtres |
| `frontend/frontoffice/lib/documentTemplates.js` | **Nouveau** — templates HTML des 3 documents + `openDocument()` |

### Séparation logique / présentation

Conformément à l'organisation du projet, la page ne contient **aucun HTML de
document** : les templates vivent dans `lib/documentTemplates.js` :

- `shell(titre, sousTitre, corps, reference)` — squelette commun : bandeau sombre
  `#0F1B24` avec logo texte XPARK, liseré rouge `#C11425`, pied de page société,
  bouton « Imprimer / Enregistrer en PDF » (masqué à l'impression via `@media print`) ;
- `ordreMissionHtml(mission, user)` — trajet, dates, chauffeur, véhicule, coût, signatures ;
- `attestationHtml(mission, user)` — texte d'attestation + tableau de la prestation ;
- `factureHtml(facture, user)` — montants HT/TVA/TTC, échéance, statut de paiement ;
- `openDocument(html)` — ouvre une fenêtre, y écrit le HTML : le client imprime ou
  enregistre en PDF (aucune librairie PDF nécessaire).

### Pourquoi ce choix (plutôt qu'une génération PDF serveur)

- Aucune dépendance ajoutée (pas de lib PDF côté back ni front) ;
- Les documents sont **toujours à jour** : régénérés à l'ouverture depuis les données live ;
- L'impression navigateur produit un PDF propre au format A4.

## Comment tester

1. `/account/documents` avec un client ayant des missions → les ordres de mission listés.
2. Terminer une mission (staff) → l'attestation `AT-…` apparaît.
3. Émettre une facture → le document `FA-…` apparaît sous le filtre 🧾.
4. Cliquer « Ouvrir / PDF » → fenêtre d'impression, vérifier l'en-tête XPARK et les données.

> ⚠️ Si rien ne s'ouvre : autoriser les pop-ups pour `localhost:3001` (message affiché au client).
