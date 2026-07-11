# Guide de développement

## Lancer en local

```bash
cd AyshaaRAG
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements-dev.txt
docker run -d -p 6333:6333 qdrant/qdrant:v1.12.4
uvicorn app.main:app --reload --port 8010
```

Swagger : http://localhost:8010/docs — tester `/chat` directement.

## Tests

```bash
pytest tests/ -q        # 16 tests, < 3 s, sans Qdrant ni modèle
```

| Fichier | Couvre |
|---|---|
| `test_language.py` | détection fr/en/ar + darija romanisée + normalisation arabe |
| `test_chunking.py` | front-matter, découpe, IDs UUID déterministes, KB trilingue |
| `test_retrieval.py` | BM25 dans les 3 langues, fusion RRF (origines et ordre) |
| `test_memory.py` | fenêtre glissante, isolation des sessions |

Les tests unitaires n'exigent ni Qdrant ni le modèle d'embeddings : le
retrieval dense est testé en intégration via `/health` et les appels réels.

## Enrichir la base de connaissances (tâche la plus fréquente)

1. Éditer ou créer `knowledge/<sujet>.<lang>.md` :

```markdown
---
lang: fr
topic: nouveau-sujet
audience: client
title: Titre lisible du document
---

## Question fréquente en langage naturel ?

Réponse complète et autonome (2 à 8 phrases). Chaque section ## devient
un chunk : elle doit se suffire à elle-même.
```

2. Écrire les trois langues (fr, en, ar) — le retrieval filtre par langue.
3. Réindexer : `POST /admin/reindex` (ou redémarrer le conteneur).
4. Vérifier : poser la question via Swagger et contrôler `sources`.

**Bonnes pratiques KB** : une question par section ; formulations proches de
celles des utilisateurs ; inclure les mots-clés exacts (BM25) ; en darija,
écrire comme on parle (pas d'arabe littéral).

## Ajouter un provider LLM (ex. API cloud)

1. Implémenter la classe dans `app/rag/providers.py` (interface
   `GenerationProvider` : `generate()` + `stream()`).
2. L'instancier dans `AyshaaPipeline.__init__` et l'insérer dans la logique
   de choix de `_prepare()`.
3. Aucune autre couche à toucher : l'API et le widget sont agnostiques.

## Conventions

- Python 3.12, type hints partout, docstrings en français (contexte PFE).
- Un module = une responsabilité ; l'API ne connaît que le pipeline.
- Jamais de texte utilisateur dans les logs (longueur et langue seulement).
- Toute nouvelle dépendance doit être justifiée dans `decisions.md`.
