# Diagrammes de séquence

## 1. Question utilisateur (streaming SSE)

```mermaid
sequenceDiagram
    actor U as Visiteur
    participant W as Widget (frontoffice)
    participant A as AyshaaRAG API
    participant P as Pipeline
    participant Q as Qdrant
    participant O as Ollama (optionnel)
    participant M as SQLite (mémoire)

    U->>W: tape ou dicte « Combien coûte un transport ? »
    W->>A: POST /api/v1/chat/stream {message, session_id}
    A->>P: answer_stream()
    P->>P: detect_language() → fr
    par retrieval hybride
        P->>Q: search(vecteur, filtre lang=fr)
        Q-->>P: top-12 dense
    and
        P->>P: BM25 top-12 (en mémoire)
    end
    P->>P: fusion RRF + contrôle de confiance
    A-->>W: event meta {session_id, lang}
    alt Ollama disponible
        P->>O: /api/chat (system + mémoire + contexte)
        loop chaque token
            O-->>P: token
            A-->>W: event token
        end
    else repli extractif
        loop chaque phrase du meilleur chunk (langue fr)
            A-->>W: event token
        end
    end
    P->>M: append(user), append(assistant)
    A-->>W: event done {sources, suggestions}
    W->>U: affiche + lit à voix haute si 🔊 activé
```

## 2. Accueil automatique du visiteur

```mermaid
sequenceDiagram
    actor U as Visiteur
    participant W as Widget
    participant A as AyshaaRAG

    U->>W: arrive sur http://localhost:3001
    W->>W: langue navigateur → fr/en/ar
    W->>W: après 2,5 s : bulle « Bonjour ! Je suis Ayshaa… »
    U->>W: clique (bulle ou bouton 💬)
    W->>A: GET /api/v1/greeting?lang=fr
    A-->>W: {message d'accueil, suggestions}
    W->>U: panneau ouvert, accueil affiché, suggestions cliquables
```

## 3. Réindexation de la base de connaissances

```mermaid
sequenceDiagram
    actor Ops as Admin
    participant A as AyshaaRAG
    participant P as Pipeline
    participant Q as Qdrant

    Ops->>Ops: édite knowledge/*.md
    Ops->>A: POST /api/v1/admin/reindex (X-Admin-Key)
    A->>A: comparaison clé en temps constant
    A->>P: reindex()
    P->>P: chunking (uuid5 déterministes)
    P->>P: reconstruction BM25
    P->>P: embeddings des chunks
    P->>Q: delete collection + upsert par lots de 256
    A-->>Ops: {chunks: 81, qdrant_indexed: 81}
```

## 4. Entrée vocale (côté navigateur)

```mermaid
sequenceDiagram
    actor U as Visiteur
    participant W as Widget
    participant SR as SpeechRecognition (navigateur)

    U->>W: clique 🎙️
    W->>SR: start(lang = fr-FR / en-US / ar-TN)
    U->>SR: parle
    SR-->>W: transcript
    W->>W: send(transcript) → même flux que le texte
    Note over W: réponse lue par speechSynthesis si 🔊 activé
```
