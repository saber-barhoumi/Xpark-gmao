# 🤖 Assistant IA — `/account/assistant`

## Ce que voit le client

- Un **chat** à la charte XPARK : bulles client (rouge) / assistant (carte), indicateur
  « L'assistant écrit… », suggestions cliquables, boutons d'action vers les pages du portail.
- L'assistant sait :
  1. **Estimer un prix de trajet en direct** — « Combien coûte un transport Tunis → Sfax ? »
     → prix TND, distance et durée calculés par la **vraie IA de tarification** ;
  2. **Guider** : réservation, suivi, annulation, factures, documents, analyses, contact, délais.
- L'historique est conservé (localStorage), bouton 🗑️ Effacer.
- Le bouton 🤖 du header du portail ouvre directement cette page.

## Comment c'est fait

### Fichiers — logique séparée de l'UI

| Fichier | Rôle |
|---|---|
| `frontend/frontoffice/lib/assistantEngine.js` | **Nouveau** — cerveau : intentions, détection de villes, appels IA |
| `frontend/frontoffice/app/account/assistant/page.js` | UI du chat uniquement (bulles, saisie, persistance) |
| `frontend/frontoffice/lib/missionService.js` | `aiService` existant : `/cities`, `/distance`, `/predict` (:8000) |

### Pipeline d'une question (`reply(message)`)

1. **Normalisation** : minuscules + suppression des accents (`norm()`), pour matcher
   « Gabès », « gabes »…
2. **Détection de villes** (`detectCities`) : la liste officielle vient de
   `GET :8000/cities` (mise en cache) ; les occurrences sont triées par position, avec
   priorité au nom le plus long en cas de chevauchement.
3. **2 villes trouvées → estimation réelle** : `GET /distance` + `POST /predict`
   en parallèle (profil par défaut : fourgon, 500 kg, départ +24 h) → réponse
   « Prix estimé / Distance / Durée » + bouton « Réserver ce trajet ».
4. Sinon, **intentions par mots-clés** (réserver, suivi, annuler, facture, document,
   analyse, support, délai, salutations) → réponse + liens vers la bonne page.
5. **Fallback** : suggestions cliquables (`QUICK_REPLIES`).

Le moteur ne lève jamais d'exception : si l'IA (:8000) est indisponible, il répond
poliment et propose la réservation classique.

### Choix d'architecture

- Moteur d'intentions **déterministe et hors ligne** (hors estimation prix) : pas de
  clé API externe, pas de coût, réponses instantanées et maîtrisées.
- La seule « vraie IA » appelée est le **CalculateurPrixTrajetIA** du projet (modèle
  ML de tarification), déjà utilisé par la réservation — cohérence des prix garantie.
- Brancher un LLM plus tard = remplacer uniquement `reply()` dans `assistantEngine.js`,
  l'UI ne change pas.

## Comment tester

1. `/account/assistant` → message d'accueil + suggestions.
2. « Combien coûte un transport Tunis → Sfax ? » → prix/distance/durée réels (service :8000 démarré).
3. « Comment annuler ma réservation ? » → réponse + liens Mes missions / Support.
4. Recharger la page → l'historique est conservé ; 🗑️ Effacer le réinitialise.
