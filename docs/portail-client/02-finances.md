# 💰 Finances — `/account/finances`

## Ce que voit le client

- **4 indicateurs** : dépenses réalisées (missions terminées), engagements en cours
  (estimations IA des missions actives), montant + nombre de factures à payer,
  factures payées.
- **Mes factures** : tableau (n°, date, échéance, montant TTC, statut, date de paiement).
- **Coûts par mission** : trajet, date, distance, statut et coût — marqué *(final)*
  pour les missions clôturées, *(estimé)* pour les estimations IA.

## Comment c'est fait

### Fichiers

| Fichier | Rôle |
|---|---|
| `frontend/frontoffice/app/account/finances/page.js` | Page (totaux + 2 tableaux) |
| `frontend/frontoffice/lib/financeService.js` | **Nouveau** service → Finance.API |
| `microservices/Finance.API/Controllers/FacturesController.cs` | **Nouvel endpoint** `GET /api/factures/my` |

### Endpoint ajouté côté backend

```csharp
/// Factures du client connecté (portail frontoffice) — id lu dans le JWT.
[HttpGet("my")]
public async Task<IActionResult> GetMy()
{
    var claim = User.FindFirst("userId")?.Value;
    if (!long.TryParse(claim, out var userId)) return Unauthorized();
    var factures = await service.GetByClientAsync(userId);
    return Ok(factures);
}
```

- L'identité vient du **claim `userId` du JWT** (posé par IAM.API à la connexion) :
  impossible de consulter les factures d'un autre client.
- Au passage, `GET /api/factures/client/{clientId}` (qui acceptait n'importe quel
  utilisateur authentifié) est désormais réservé au staff :
  `[Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]`.
- Convention : `Facture.ClientId` = `IdUtilisateur` du client (même identifiant que
  `Mission.ClientIdUtilisateur`).

### Calculs côté page

- `dépensé` = Σ `coutTotal || coutEstimeAI` des missions `TERMINEE` ;
- `engagé` = Σ `coutEstimeAI` des missions `EN_ATTENTE` + `EN_COURS` ;
- `impayées` = factures `statut === "EN_ATTENTE"` (somme `montantTTC`).

Les deux appels API partent en parallèle (`Promise.allSettled`) : si Finance.API est
indisponible, la page affiche quand même les coûts missions.

## Comment tester

1. `/account/finances` avec un client ayant des missions → totaux + tableau coûts.
2. Tant qu'aucune facture n'est émise : message « Aucune facture émise pour le moment ».
3. Créer une facture (staff, `POST /api/factures` avec `clientId` = id utilisateur du
   client, `missionId` optionnel) → elle apparaît dans « Mes factures », et en PDF
   dans 📄 Documents.
