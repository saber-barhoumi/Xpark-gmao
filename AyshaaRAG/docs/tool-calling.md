# Tool Calling — les capacités « temps réel » d'Ayshaa

## Pourquoi

Un RAG répond avec des **documents** ; or « où est mon camion ? » n'a pas de
réponse documentaire — elle change toutes les 5 secondes. Le Tool Calling
donne à Ayshaa l'accès aux **APIs vivantes** de XPARK, avec les droits de
l'utilisateur connecté et rien de plus.

## Contrat (`app/tools/base.py`)

```python
class Tool(Protocol):
    name: str                 # identifiant (routeur + LLM + métriques)
    description: str          # ce que fait l'outil (prompt de classification)
    requires_auth: bool       # True = JWT du portail exigé
    async def run(ctx: ToolContext, **params) -> ToolResult
```

- `ToolContext` porte la langue, le JWT (transmis tel quel aux APIs) et la
  session. **Ayshaa ne possède aucun compte de service** : sans JWT, un outil
  `requires_auth` répond « connectez-vous d'abord » dans la langue du client.
- `ToolResult` est **structuré** (`ok / data / error / missing_params`) :
  l'outil ne rédige jamais — la mise en mots appartient à l'orchestrateur.
- `ToolRegistry.execute` centralise : outil inconnu, auth manquante,
  401/403 → `auth_required`, erreurs réseau → `api_error` (message propre
  trilingue, jamais de stacktrace à l'utilisateur).

## Les 7 outils

| Outil | API appelée | Auth | Déclencheurs (exemples) |
|---|---|---|---|
| `my_missions` | Mission `/api/missions/my` | ✔ | « mes missions », "my active missions" |
| `my_quotations` | Mission `/api/missions/demandes/my` | ✔ | « où en est mon devis ? » |
| `where_is_my_truck` | Mission `/missions/my` + `/tracking/mission/{id}/live` | ✔ | « où est mon camion », "track my shipment", « win el camion » |
| `price_estimate` | Pricing `:8000 /predict` (+ `/cities` pour l'extraction) | ✖ | « combien coûte Tunis-Sfax ? », "how much…", « ch7al » |
| `my_profile` | IAM `/api/auth/profile` | ✔ | « mon compte », "who am I" |
| `password_reset` | IAM `/api/auth/recover-password` | ✖ | « mot de passe oublié » (+ email extrait ou demandé) |
| `fleet_overview` | Mission `/missions` + Fleet `/vehicules` | ✔ (staff) | « stats du jour », "fleet status" |

## Entités et questions de suivi

L'extraction est **conservatrice** : les villes sont validées contre
`GET /cities` du service de prix (insensible aux accents : « beja » ↔ « Béja »),
l'email par regex stricte. Paramètre manquant → **question de suivi** dans la
langue de l'utilisateur (« indiquez-moi la ville de départ et d'arrivée… »),
jamais de devinette. Formats de trajets compris : « de X à Y », « X - Y »,
"from X to Y", « mn X l Y », ou deux villes citées librement.

## Mise en mots

1. **Gabarits trilingues** (`prompts/tool_answers.py`) — toujours exécutés :
   réponse complète fr/en/darija sans LLM (statuts traduits, liens Google
   Maps pour le GPS, montants formatés).
2. **Polish LLM** (optionnel) — si Ollama est disponible, il reformule le
   gabarit plus naturellement. Garde-fou anti-hallucination : si un des
   chiffres clés du gabarit disparaît de la reformulation, le gabarit
   d'origine est conservé.

## Sécurité

- RBAC : **celui des APIs, jamais contourné** (`CanRead` du tracking, rôles
  staff des stats, ownership des missions).
- Lecture seule : aucun outil ne crée/modifie de données métier. La seule
  « action » est `password_reset`, qui déclenche le flux email officiel
  (l'API répond volontairement 200 même pour un email inconnu —
  anti-énumération, Ayshaa relaie ce comportement).
- Timeout global `AYSHAA_TOOLS_TIMEOUT` (8 s) : une API lente ne gèle pas le chat.

## Ajouter un outil (5 minutes)

1. Créer `app/tools/mon_outil.py` avec `name/description/requires_auth/run`.
2. L'enregistrer dans `build_registry()` (`agent/orchestrator.py`).
3. Ajouter ses motifs dans `TOOL_PATTERNS` (`agent/router.py`) + une ligne au
   prompt `_CLASSIFY_PROMPT`.
4. Écrire son formatteur trilingue dans `prompts/tool_answers.py` (`FORMATTERS`).
5. Tests : motifs dans `tests/test_router.py`, formatteur dans
   `tests/test_tool_answers.py`.
