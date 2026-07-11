# 🤖 Ayshaa — Assistante virtuelle RAG de XPARK

Ayshaa est l'assistante conversationnelle du site vitrine XPARK
(http://localhost:3001). Elle répond **en français, anglais et tounsi
(darija)**, **par texte ou par la voix**, à toutes les questions sur XPARK :
services, tarifs, réservation, suivi de livraison, factures, compte client,
processus internes (chauffeurs, techniciens, rôles)…

Elle repose sur une architecture **RAG (Retrieval-Augmented Generation)**
complète, développée comme **microservice indépendant** dans ce dossier.

## Démarrage rapide

```bash
# Depuis la racine du projet
docker compose up -d qdrant ayshaa-rag        # le service indexe la KB au démarrage
curl http://localhost:8010/health              # → status ok, 81 chunks indexés

# LLM génératif local (optionnel — sinon mode extractif automatique)
docker compose --profile llm up -d ollama
docker exec xpark-ollama ollama pull qwen2.5:3b-instruct
```

Le widget est intégré au frontoffice (`docker compose up -d frontoffice`) :
bouton flottant en bas à gauche de http://localhost:3001.

## Vue d'ensemble

| Composant | Technologie | Pourquoi |
|---|---|---|
| API | FastAPI (Python 3.12) | async natif (SSE), cohérent avec CalculateurPrixTrajetIA |
| Small talk | couche d'intentions avant le RAG (`smalltalk.py`) | « bonjour / سلام / hello » reçoivent un accueil naturel, jamais un passage documentaire |
| Détection de langue | lexique darija issu du **corpus CleanData** (23 133 commentaires réels) + noyau certifié, score pondéré | darija romanisée (« chhal el prix ») détectée de façon fiable |
| Base vectorielle | **Qdrant** | HNSW + filtrage payload par langue, conteneur léger, snapshots |
| Embeddings | **fastembed** (ONNX) — paraphrase-multilingual-MiniLM-L12-v2, 384 d | multilingue fr/en/ar sans PyTorch (image ~10× plus légère) |
| Retrieval | **Hybride** : dense + BM25 fusionnés par **RRF**, expansion arabizi→arabe, boost langue, sélection à seuil relatif dédoublonnée | précision du contexte : plus de passages hors sujet concaténés |
| Génération | **Ollama** (qwen2.5:3b-instruct) avec **repli extractif** (1 chunk fort, intros variées) | 0 donnée externe, 0 coût ; le service répond TOUJOURS (dégradation gracieuse) |
| Mémoire | SQLite, fenêtre glissante, TTL 24 h | suivi des questions de relance (« et pour Sfax ? ») |
| Voix | Web Speech API (navigateur) — la voix suit la **langue de la réponse** | STT + TTS fr/en/ar sans serveur GPU ; Whisper documenté en évolution |
| Observabilité | logs JSON + Prometheus `/metrics` | latence, langues, providers, « je ne sais pas » |

Base de connaissances : **27 documents** (9 sujets × 3 langues, ~147 chunks) —
entreprise/services, réservation/tarifs, suivi/documents/factures,
compte/sécurité/support, équipe interne, FAQ pratique, flotte/véhicules,
sécurité des marchandises, paiement/TVA. Widget : bas-droite, avatar
professionnel vectoriel (`AyshaaAvatar.js`), accueil automatique.

## Documentation complète (docs/)

| Document | Contenu |
|---|---|
| [architecture.md](docs/architecture.md) | Diagramme global, modules, communication, flux de données |
| [rag-pipeline.md](docs/rag-pipeline.md) | Ingestion, chunking, retrieval hybride, prompts, mémoire |
| [api.md](docs/api.md) | Contrat complet des endpoints (exemples curl) |
| [database-schema.md](docs/database-schema.md) | Collection Qdrant + schéma SQLite |
| [sequence-diagrams.md](docs/sequence-diagrams.md) | Séquences : question, streaming, réindexation |
| [installation.md](docs/installation.md) | Installation locale et Docker pas à pas |
| [configuration.md](docs/configuration.md) | Toutes les variables d'environnement |
| [deployment.md](docs/deployment.md) | Production, scaling, sauvegardes, sécurité |
| [development.md](docs/development.md) | Guide développeur : structure, tests, ajout de connaissances |
| [user-guide.md](docs/user-guide.md) | Guide utilisateur du widget (texte, voix, langues) |
| [decisions.md](docs/decisions.md) | ADR — chaque choix technique justifié |

## Structure du projet

```
AyshaaRAG/
├── app/
│   ├── main.py                 # assemblage FastAPI (middlewares, routes, lifespan)
│   ├── config.py               # configuration pydantic-settings (env AYSHAA_*)
│   ├── api/                    # routes HTTP (chat, admin, système)
│   ├── core/                   # transverse : logs JSON, erreurs, sécurité, rate-limit, métriques
│   ├── models/                 # schémas Pydantic (contrat API)
│   └── rag/                    # le cœur RAG
│       ├── chunking.py         # ingestion + découpage heading-aware
│       ├── embeddings.py       # fastembed (dégradation gracieuse)
│       ├── vectorstore.py      # Qdrant
│       ├── lexical.py          # BM25 + normalisation arabe
│       ├── retriever.py        # fusion hybride RRF
│       ├── language.py         # détection fr/en/ar (+ darija romanisée)
│       ├── memory.py           # mémoire de conversation SQLite
│       ├── prompts.py          # persona Ayshaa + gabarits trilingues
│       ├── providers.py        # Ollama + extractif
│       └── pipeline.py         # orchestrateur
├── knowledge/                  # base de connaissances (15 docs Markdown, fr/en/ar)
├── tests/                      # 16 tests unitaires (pytest)
├── docs/                       # documentation PFE
├── Dockerfile
└── requirements.txt
```

## Intégration frontoffice

- `frontend/frontoffice/components/assistant/AyshaaWidget.js` — widget flottant
  (bas-gauche) : accueil automatique, chat streamé, micro 🎙️, réponse vocale 🔊,
  sélecteur FR/EN/تونسي, RTL automatique.
- `frontend/frontoffice/lib/ayshaaService.js` — client API (greeting + SSE).
- Monté globalement dans `app/layout.js`, masqué sur `/account` et `/auth`
  (le portail client a son propre assistant).
