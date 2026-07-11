# Décisions d'architecture (ADR)

Chaque décision : contexte → options → choix → conséquences.

## ADR-1 — Microservice indépendant

**Contexte** : l'assistant doit vivre sur le site vitrine sans fragiliser les
services métier. **Options** : module dans IAM/Mission.API ; service Node
dans le frontoffice ; microservice Python séparé. **Choix** : microservice
séparé (`AyshaaRAG/`), aligné sur le pattern du projet (CalculateurPrixTrajetIA).
**Conséquences** : déploiement/scaling indépendants, pannes isolées, le seul
couplage est la base de connaissances (du contenu, pas du code).

## ADR-2 — Qdrant comme base vectorielle

**Options** : pgvector (PostgreSQL existant), Chroma, FAISS, Qdrant.
**Choix** : Qdrant. **Pourquoi** : base vectorielle dédiée production (HNSW),
**filtrage par payload natif** (langue/audience au moment de la recherche —
central ici), snapshots, conteneur 50 Mo, API limpide. pgvector aurait couplé
l'assistant à la base métier partagée ; FAISS n'a ni serveur ni filtrage ;
Chroma est moins mature opérationnellement.

## ADR-3 — fastembed plutôt que sentence-transformers

**Contexte** : embeddings multilingues fr/en/ar dans un conteneur raisonnable.
**Choix** : fastembed (ONNX Runtime), modèle
paraphrase-multilingual-MiniLM-L12-v2 (384 d). **Pourquoi** : pas de PyTorch
(-2 Go d'image), inférence CPU rapide, maintenu par l'équipe Qdrant, le modèle
couvre les 3 langues. **Conséquence** : image finale ~450 Mo, démarrage ~20 s
au premier run (téléchargement du modèle, ensuite en cache volume).

## ADR-4 — Retrieval hybride BM25 + dense, fusion RRF

**Contexte** : questions courtes, termes exacts (MFA, villes), darija
romanisée. **Choix** : BM25 (rank-bm25, en mémoire) + dense (Qdrant), fusion
Reciprocal Rank Fusion (k=60). **Pourquoi** : RRF fusionne des scores
d'échelles incomparables sans calibration ; chaque retriever couvre les
angles morts de l'autre ; BM25 sert aussi de filet si le modèle d'embedding
est indisponible. **Conséquence** : la confiance est jugée par « preuve
lexicale OU cosinus ≥ 0.45 » — un vecteur seul retourne toujours des voisins,
même hors sujet.

## ADR-5 — Ollama local + repli extractif (pas d'API cloud)

**Contexte** : pas de clé API cloud garantie ; exigence « le service répond
toujours ». **Choix** : Ollama (qwen2.5:3b-instruct, bon fr/en/ar) en profil
Docker optionnel, et un **ExtractiveProvider** complet en repli (compose la
réponse depuis les chunks de la langue de l'utilisateur). **Pourquoi** :
0 donnée ne sort de l'infrastructure (argument entreprise), 0 coût ;
la dégradation gracieuse est un vrai pattern de production, pas un stub.
**Conséquence** : sans GPU, qualité « FAQ intelligente » ; avec Ollama,
qualité conversationnelle. Brancher un provider cloud = 1 classe à ajouter.

## ADR-6 — Voix côté navigateur (Web Speech API)

**Options** : Whisper serveur + TTS serveur ; API cloud ; Web Speech API.
**Choix** : navigateur. **Pourquoi** : STT/TTS fr/en/ar disponibles dans
Chrome/Edge, latence nulle, aucun Go de modèle, l'audio ne quitte pas le
poste de l'utilisateur (confidentialité). **Limites documentées** : support
variable selon navigateur/OS (message explicite affiché) ; darija transcrite
via ar-TN avec une précision moyenne. **Évolution** : endpoint /voice/stt
Whisper si un besoin serveur apparaît — le widget n'aurait qu'à changer
d'implémentation.

## ADR-7 — SSE plutôt que WebSocket

Flux strictement unidirectionnel serveur→client pendant la génération ;
SSE passe les proxies sans configuration, se reconnecte nativement, et
s'implémente en 20 lignes des deux côtés. WebSocket n'apporterait rien ici.

## ADR-8 — KB trilingue par fichiers Markdown versionnés

**Options** : une langue + traduction à la volée ; CMS ; fichiers Markdown.
**Choix** : 5 sujets × 3 langues en Markdown avec front-matter, dans Git.
**Pourquoi** : la darija ne se traduit pas automatiquement de façon naturelle ;
le retrieval filtré par langue garantit une réponse native ; Git donne
l'historique et la revue ; la réindexation à chaud (`/admin/reindex`) rend
l'édition opérationnelle.

## ADR-9 — Mémoire SQLite à fenêtre glissante

**Options** : rien ; résumé progressif LLM ; Redis ; SQLite. **Choix** :
SQLite (fenêtre 8 tours, TTL 24 h). **Pourquoi** : les relances (« et pour
Sfax ? ») exigent une mémoire ; un résumé LLM coûterait un appel de plus par
tour pour un chat de site vitrine ; SQLite persiste sans dépendance. Redis
est l'évolution documentée pour le multi-instances (interface stable).

## ADR-10 — Détecteur de langue maison

langdetect/lingua sont peu fiables sur < 5 mots et ignorent l'arabizi
(« chhal 3andkom »). Trois signaux robustes : écriture arabe, lexique darija
romanisée + chiffres-lettres (3/7/9), mots-outils fr vs en. 20 lignes,
testé, zéro dépendance.
