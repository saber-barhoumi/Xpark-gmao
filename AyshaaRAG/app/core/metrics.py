"""
Métriques Prometheus — exposées sur GET /metrics.

Quatre signaux suffisent à piloter un assistant RAG :
 - volume de messages (par langue et par provider de génération) ;
 - latence de bout en bout du pipeline ;
 - hits « je ne sais pas » (qualité de la base de connaissances) ;
 - erreurs par composant.
"""
from prometheus_client import Counter, Histogram

CHAT_MESSAGES = Counter(
    "ayshaa_chat_messages_total",
    "Messages traités",
    ["lang", "provider"],
)

CHAT_LATENCY = Histogram(
    "ayshaa_chat_latency_seconds",
    "Latence du pipeline RAG (retrieval + génération)",
    buckets=(0.1, 0.25, 0.5, 1, 2, 5, 10, 30),
)

CHAT_NO_ANSWER = Counter(
    "ayshaa_chat_no_answer_total",
    "Réponses en repli « je ne sais pas » (trous de la base de connaissances)",
    ["lang"],
)

COMPONENT_ERRORS = Counter(
    "ayshaa_component_errors_total",
    "Erreurs par composant (qdrant, ollama, embeddings)",
    ["component"],
)
