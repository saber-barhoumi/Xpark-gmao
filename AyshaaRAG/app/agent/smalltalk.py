"""
Small talk — la couche conversationnelle AVANT le RAG.

Le bug corrigé ici : « Bonjour » passait dans le pipeline de retrieval et
récupérait des chunks sans rapport (ou le repli « je ne sais pas »). Un vrai
agent d'accueil salue, se présente, répond aux remerciements… Ces intentions
sont détectées par lexique multilingue et reçoivent des réponses NATURELLES
et VARIÉES (choix aléatoire) — comme une employée tunisienne, pas un robot.

Si le message contient AUSSI une vraie question (« bonjour, combien coûte un
transport ? »), le small talk s'efface : seuls les messages courts purement
conversationnels sont interceptés.
"""
from __future__ import annotations

import random
import re

from app.agent.language import normalize_arabic

# ── Déclencheurs par intention (fr / en / darija romanisée / arabe) ──────────

_INTENTS: dict[str, set[str]] = {
    "greeting": {
        "bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "hey", "yo",
        "aslema", "asslema", "salam", "aleykoum", "alaykoum", "sbah", "sbeh",
        "السلام", "سلام", "عليكم", "اهلا", "أهلا", "مرحبا", "صباح", "مساء",
        "عسلامة", "اسلامة", "هلا",
    },
    # NB : pas de mots trop génériques ici (« how », « are », « شنية », « va ») —
    # ils déclencheraient sur de vraies questions ; les tournures complètes
    # (« how are you », « ça va ») sont gérées par _PHRASES.
    "how_are_you": {
        "cv", "cava", "ca-va", "labes", "lebes",
        "chbik", "ahwelek", "a7welek", "hwelek", "ahwalek",
        "لاباس", "احوالك", "أحوالك", "حالك", "كيفك",
    },
    "thanks": {
        "merci", "thanks", "thank", "thx", "chokran", "choukran", "aychek",
        "3aychek", "y3aychek", "yaatik", "y3atik", "barakallahoufik", "saha",
        "sa7a", "شكرا", "يعيشك", "يعطيك", "الصحة", "بارك", "مرسي",
    },
    "goodbye": {
        "bye", "goodbye", "aurevoir", "revoir", "bislema", "beslema",
        "بالسلامة", "وداعا", "سلامات", "تصبح", "filemen", "fi-lemen",
    },
    "who_are_you": {
        "qui", "es-tu", "êtes-vous", "who", "chkoun", "chkounek", "شكون",
        "شكونك", "انتي", "أنتي", "عيشة", "ayshaa", "aysha",
    },
    "ok": {
        "ok", "okay", "d'accord", "daccord", "behi", "بهي", "باهي", "yes",
        "oui", "no", "non", "لا", "ايه", "أيه", "top", "parfait", "great",
        "nice", "bien", "cool",
    },
}

# Mots « question » : s'ils sont présents, ce n'est PAS que du small talk
_QUESTION_MARKERS = {
    "combien", "comment", "quel", "quelle", "quels", "pourquoi", "quand",
    "how", "what", "when", "where", "why", "which", "much",
    "chhal", "ch7al", "9adech", "kifach", "kifech", "chnowa", "chnia",
    "wa9tach", "3lech", "alech",
    "قداش", "كيفاش", "شنوة", "شنية", "وقتاش", "علاش", "وين",
    "prix", "devis", "transport", "livraison", "facture", "mission",
    "reserver", "réserver", "book", "price", "quote", "track", "invoice",
    "سوم", "نقل", "توصيلة", "فاتورة", "حجز", "اوقات", "أوقات", "توقيت",
    "العمل", "خدمة", "كرهبة", "كميون", "بضاعة", "حساب", "دعم",
    "horaires", "hours", "vehicule", "véhicule", "camion", "compte",
    "paiement", "payer", "pay", "vehicles", "goods", "delivery",
}


# Phrases complètes reconnues AVANT le filtre « marqueurs de question »
# (« how are you » contient l'interrogatif how mais reste du small talk)
_PHRASES: dict[str, set[str]] = {
    "how_are_you": {
        "how are you", "how are you doing", "how is it going", "hows it going",
        "ca va", "ça va", "cv", "comment ca va", "comment ça va", "comment vas tu",
        "comment allez vous", "tu vas bien", "vous allez bien",
        "لاباس", "لاباس عليك", "شنية احوالك", "شنيه احوالك", "كيفك", "شنية الاحوال",
        "labes", "lebes", "chniya ahwelek", "ahwelek",
    },
    "who_are_you": {
        "qui es tu", "qui etes vous", "qui êtes vous", "who are you", "what are you",
        "شكونك", "شكون انتي", "انتي شكون", "chkounek", "chkoun enti",
    },
}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[\w؀-ۿ'-]+", normalize_arabic(text.lower()))


def detect_intent(text: str) -> str | None:
    """Retourne l'intention small talk, ou None si c'est une vraie question."""
    toks = _tokens(text)
    if not toks or len(toks) > 7:              # message long = vraie demande
        return None

    # 1. Phrases complètes (prioritaires sur les marqueurs de question)
    phrase = " ".join(toks)
    for intent, phrases in _PHRASES.items():
        if phrase in {normalize_arabic(p) for p in phrases}:
            return intent

    # 2. Vraie question → laisser le RAG répondre
    if any(t in _QUESTION_MARKERS for t in toks):
        return None

    # 3. Mots-déclencheurs simples
    norm = {normalize_arabic(t) for t in toks}
    for intent in ("thanks", "goodbye", "who_are_you", "how_are_you", "greeting", "ok"):
        vocab = {normalize_arabic(w) for w in _INTENTS[intent]}
        if norm & vocab:
            return intent
    return None


# ── Réponses naturelles et variées (persona Ayshaa) ──────────────────────────

_REPLIES: dict[str, dict[str, list[str]]] = {
    "greeting": {
        "fr": [
            "Bonjour ! 😊 Je suis Ayshaa, l'assistante virtuelle de XPARK. Comment puis-je vous aider aujourd'hui ?",
            "Bonjour et bienvenue chez XPARK ! 👋 Je suis Ayshaa. Une question sur nos transports, un devis, un suivi de livraison ?",
            "Salut ! 😊 Ayshaa, à votre service. Dites-moi ce qu'il vous faut : tarifs, réservation, suivi… je suis là pour ça !",
        ],
        "en": [
            "Hello! 😊 I'm Ayshaa, XPARK's virtual assistant. How can I help you today?",
            "Hi there! 👋 Welcome to XPARK. I'm Ayshaa — ask me anything about our transport services, quotes or deliveries.",
            "Hey! 😊 Ayshaa here, happy to help. What do you need — prices, booking, tracking?",
        ],
        "ar": [
            "أهلا وسهلا! 😊 أنا عيشة، المساعدة الافتراضية متاع XPARK. كيفاش نجم نعاونك اليوم؟",
            "عسلامة! 👋 مرحبا بيك في XPARK. أنا عيشة — اسألني اللي تحب على النقل، الأسعار ولا التوصيل.",
            "وعليكم السلام! 😊 أنا عيشة من XPARK. قولي شنوة تحب: سوم، حجز، تتبّع توصيلة؟ أنا هوني باش نعاونك!",
        ],
    },
    "how_are_you": {
        "fr": [
            "Ça va très bien, merci ! 😊 Et vous ? Dites-moi comment je peux vous aider.",
            "Toujours en pleine forme pour aider les clients XPARK ! 💪 Et vous, que puis-je faire pour vous ?",
        ],
        "en": [
            "I'm doing great, thanks for asking! 😊 How can I help you?",
            "All good here, always ready to help! 💪 What can I do for you?",
        ],
        "ar": [
            "الحمد لله لاباس عليا! 😊 وانتي/انت شنية أحوالك؟ قولي كيفاش نعاونك.",
            "مليحة الحمد لله، ديما حاضرة نعاون حرفاء XPARK! 💪 شنوة نجم نعملك؟",
        ],
    },
    "thanks": {
        "fr": [
            "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
            "Je vous en prie ! C'est un plaisir d'aider. À bientôt chez XPARK 🚚",
        ],
        "en": [
            "You're very welcome! 😊 Don't hesitate if you have more questions.",
            "My pleasure! Happy to help anytime. See you at XPARK 🚚",
        ],
        "ar": [
            "يعيشك! 😊 على راحتك، إذا عندك أسئلة أخرين أنا هوني.",
            "العفو، هذا واجبي! 🚚 مرحبا بيك ديما في XPARK.",
        ],
    },
    "goodbye": {
        "fr": [
            "Au revoir ! 👋 Merci d'avoir discuté avec moi — l'équipe XPARK reste à votre service.",
            "À bientôt ! 😊 Bonne journée, et pensez à XPARK pour vos transports !",
        ],
        "en": [
            "Goodbye! 👋 Thanks for chatting — the XPARK team is always here for you.",
            "See you soon! 😊 Have a great day, and think XPARK for your next delivery!",
        ],
        "ar": [
            "بالسلامة! 👋 يعيشك اللي حكيت معايا — فريق XPARK ديما في خدمتك.",
            "فيلامان! 😊 نهارك زين، وما تنساش XPARK في النقلات الجاية!",
        ],
    },
    "who_are_you": {
        "fr": [
            "Je suis Ayshaa 😊 l'assistante virtuelle de XPARK, spécialiste du transport de marchandises en Tunisie. "
            "Je réponds en français, anglais et tounsi — par écrit ou par la voix — sur tout ce qui touche XPARK : "
            "services, tarifs, réservations, suivi, factures, compte client…",
        ],
        "en": [
            "I'm Ayshaa 😊 XPARK's virtual assistant — freight transport specialists in Tunisia. "
            "I answer in English, French and Tunisian Arabic — by text or voice — about everything XPARK: "
            "services, prices, bookings, tracking, invoices, your account…",
        ],
        "ar": [
            "أنا عيشة 😊 المساعدة الافتراضية متاع XPARK، شركة نقل البضائع التونسية. "
            "نجاوب بالتونسي وبالفرنسية وبالإنجليزية — بالكتيبة ولا بالصوت — على كل شي يخص XPARK: "
            "الخدمات، الأسعار، الحجوزات، التتبّع، الفواتير، حسابك…",
        ],
    },
    "ok": {
        "fr": ["Parfait ! 😊 Autre chose pour vous ?", "Très bien ! Je reste là si besoin."],
        "en": ["Perfect! 😊 Anything else?", "Great! I'm here if you need anything."],
        "ar": ["باهي! 😊 حاجة أخرى؟", "بهي، أنا هوني كان تستحقني!"],
    },
}

_SUGGEST_AFTER = {"greeting", "who_are_you", "how_are_you", "ok"}


def reply_smalltalk(intent: str, lang: str) -> tuple[str, bool]:
    """(réponse naturelle, faut-il afficher les suggestions ?)"""
    variants = _REPLIES.get(intent, {}).get(lang) or _REPLIES[intent]["fr"]
    return random.choice(variants), intent in _SUGGEST_AFTER


# Salutations en tête de message (« Bonjour, combien coûte… ») : retirées de la
# requête AVANT le retrieval — elles diluent le score BM25 de la vraie question.
_GREETING_PREFIX_RE = re.compile(
    r"^\s*(bonjour|bonsoir|salut|coucou|hello|hi|hey|aslema|asslema|salam"
    r"|السلام عليكم|السلام|سلام|عسلامة|اهلا|أهلا|مرحبا)[\s,.!؟?…-]*",
    re.IGNORECASE,
)


def strip_greeting_prefix(text: str) -> str:
    stripped = _GREETING_PREFIX_RE.sub("", text).strip()
    return stripped if stripped else text
