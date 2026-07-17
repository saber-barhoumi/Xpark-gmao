"""
Mise en mots des résultats d'outils — gabarits trilingues fr / en / darija.

Principe : l'outil renvoie des DONNÉES, jamais du texte. Ces formatteurs
produisent une réponse naturelle dans la langue de l'utilisateur, sans LLM
(le service reste pleinement fonctionnel sans GPU). Quand Ollama est là,
l'orchestrateur peut lui demander de reformuler à partir des mêmes données —
mais le fond vient TOUJOURS des APIs : zéro hallucination possible.
"""
from __future__ import annotations

from typing import Any

STATUT_FR = {"EN_ATTENTE": "en attente", "EN_COURS": "en cours",
             "TERMINEE": "terminée", "ANNULEE": "annulée",
             "PENDING_QUOTATION": "en attente de devis", "QUOTATION_SENT": "devis envoyé",
             "ACCEPTED": "acceptée", "REJECTED": "refusée", "CANCELLED": "annulée"}
STATUT_EN = {"EN_ATTENTE": "pending", "EN_COURS": "in progress",
             "TERMINEE": "completed", "ANNULEE": "cancelled",
             "PENDING_QUOTATION": "awaiting quotation", "QUOTATION_SENT": "quotation sent",
             "ACCEPTED": "accepted", "REJECTED": "rejected", "CANCELLED": "cancelled"}
STATUT_AR = {"EN_ATTENTE": "في الانتظار", "EN_COURS": "في الطريق",
             "TERMINEE": "كملت", "ANNULEE": "تلغات",
             "PENDING_QUOTATION": "في انتظار عرض السعر", "QUOTATION_SENT": "عرض السعر تبعث",
             "ACCEPTED": "مقبولة", "REJECTED": "مرفوضة", "CANCELLED": "ملغاة"}


def _st(code: str | None, lang: str) -> str:
    table = {"fr": STATUT_FR, "en": STATUT_EN, "ar": STATUT_AR}[lang if lang in ("fr", "en", "ar") else "fr"]
    return table.get(code or "", code or "?")


# ── Messages transverses ─────────────────────────────────────────────────────

AUTH_REQUIRED = {
    "fr": "Pour consulter ces informations personnelles, connectez-vous d'abord à votre espace client — je pourrai alors vous répondre précisément. 🔐",
    "en": "To access your personal information, please log in to your client portal first — then I can give you a precise answer. 🔐",
    "ar": "باش نشوفلك المعلومات متاعك، اعمل تسجيل دخول في حسابك الأول، وبعد نجاوبك بالتفصيل. 🔐",
}

API_ERROR = {
    "fr": "Je n'arrive pas à joindre le système en ce moment. Réessayez dans un instant, ou contactez le support si ça persiste.",
    "en": "I can't reach the system right now. Please try again shortly, or contact support if it persists.",
    "ar": "ما نجمتش نوصل للسيستام توّا. عاود جرب بعد شوية، وإلا كلم السopport.",
}

ASK_CITIES = {
    "fr": "Avec plaisir ! Indiquez-moi la ville de départ et la ville d'arrivée (ex. « de Tunis à Sfax ») et je vous donne l'estimation tout de suite. 🚚",
    "en": "Sure! Tell me the departure and arrival cities (e.g. “from Tunis to Sfax”) and I'll give you an instant estimate. 🚚",
    "ar": "بكل سرور! قلي من أنا مدينة لأنا مدينة (مثال: « من تونس لصفاقس ») ونعطيك التقدير في الحين. 🚚",
}

ASK_EMAIL = {
    "fr": "Pas de souci — donnez-moi l'adresse email de votre compte et je vous envoie le lien de réinitialisation.",
    "en": "No problem — give me your account email and I'll send you the reset link.",
    "ar": "ما فيها حتى مشكلة — عطيني الإيميل متاع حسابك ونبعثلك رابط التغيير.",
}


# ── Formatteurs par outil ────────────────────────────────────────────────────

def fmt_my_missions(data: list[dict], lang: str) -> str:
    if not data:
        return {"fr": "Vous n'avez aucune mission pour le moment. Envie de réserver un transport ? Je peux vous donner un prix. 😊",
                "en": "You have no missions at the moment. Want to book a transport? I can quote you a price. 😊",
                "ar": "ما عندكش مهمات توّا. تحب تحجز نقلة؟ نجم نعطيك السوم. 😊"}[lang]
    head = {"fr": f"Voici vos {len(data)} mission(s) :", "en": f"Here are your {len(data)} mission(s):",
            "ar": f"هاذم {len(data)} مهمة متاعك:"}[lang]
    lines = []
    for m in data:
        route = f"{m.get('depart') or '—'} → {m.get('arrivee') or '—'}"
        extra = f" · {m['chauffeur']}" if m.get("chauffeur") else ""
        lines.append(f"• #{m['id']} {route} — {_st(m.get('statut'), lang)}{extra}")
    return head + "\n" + "\n".join(lines)


def fmt_my_quotations(data: list[dict], lang: str) -> str:
    if not data:
        return {"fr": "Aucune demande de transport en cours. Créez-en une depuis « Réserver » — l'IA vous propose un prix immédiatement.",
                "en": "No transport requests yet. Create one from “Book” — the AI quotes a price instantly.",
                "ar": "ما عندك حتى طلب نقل. اعمل واحد من « احجز » والذكاء الاصطناعي يعطيك السوم في الحين."}[lang]
    head = {"fr": "Vos demandes de transport :", "en": "Your transport requests:", "ar": "طلبات النقل متاعك:"}[lang]
    lines = []
    for d in data:
        prix = (f" — {d['prixDevis']:.0f} TND" if d.get("prixDevis")
                else (f" — ~{d['estimationIA']:.0f} TND (IA)" if d.get("estimationIA") else ""))
        lines.append(f"• #{d['id']} {d.get('depart')} → {d.get('arrivee')} : {_st(d.get('statut'), lang)}{prix}")
    return head + "\n" + "\n".join(lines)


def fmt_where_is_my_truck(d: dict, lang: str) -> str:
    if d.get("noActive"):
        if d.get("pending"):
            return {"fr": f"Aucun camion en route pour l'instant — vous avez {d['pending']} mission(s) en attente de départ. Je vous préviens dès que ça bouge ! 📦",
                    "en": f"No truck on the road yet — you have {d['pending']} mission(s) waiting to depart. 📦",
                    "ar": f"ما فماش كميون في الطريق توّا — عندك {d['pending']} مهمة تستنى في الانطلاق. 📦"}[lang]
        return {"fr": "Vous n'avez pas de livraison en cours actuellement.",
                "en": "You have no delivery in progress at the moment.",
                "ar": "ما عندكش توصيلة في الطريق توّا."}[lang]

    route = f"{d.get('depart') or '—'} → {d.get('arrivee') or '—'}"
    who = f" ({d['chauffeur']}, {d.get('vehicule') or ''})" if d.get("chauffeur") else ""
    if d.get("hasFix") and d.get("isFresh"):
        speed = f" · {d['speedKmh']:.0f} km/h" if d.get("speedKmh") else ""
        maps = f"https://maps.google.com/?q={d['latitude']},{d['longitude']}"
        return {"fr": f"🛰️ Votre camion est en route sur {route}{who}{speed} — position GPS en direct : {maps}\nSuivez-le sur la carte : Mon espace → Suivi en direct.",
                "en": f"🛰️ Your truck is on its way ({route}){who}{speed} — live GPS: {maps}\nFollow it on the map: My account → Live tracking.",
                "ar": f"🛰️ الكميون في الطريق ({route}){who}{speed} — الموقع المباشر: {maps}\nتبعو على الخريطة: حسابي ← التتبع المباشر."}[lang]
    return {"fr": f"Votre mission {route}{who} est en cours 🚚. Le GPS du chauffeur n'émet pas à l'instant — la carte « Suivi en direct » affiche la position estimée en attendant.",
            "en": f"Your mission {route}{who} is in progress 🚚. The driver's GPS isn't transmitting right now — the “Live tracking” map shows the estimated position meanwhile.",
            "ar": f"المهمة {route}{who} في الطريق 🚚. الGPS متاع الشوفار ساكت توّا — خريطة « التتبع المباشر » تعرضلك التقدير."}[lang]


def fmt_price_estimate(d: dict, lang: str) -> str:
    if d.get("prix") is None:
        return {"fr": f"Je ne connais pas encore le trajet {d.get('departure')} → {d.get('arrival')}. Essayez deux villes principales (Tunis, Sfax, Sousse…).",
                "en": f"I don't know the route {d.get('departure')} → {d.get('arrival')} yet. Try two major cities (Tunis, Sfax, Sousse…).",
                "ar": f"مانعرفش الترايك {d.get('departure')} → {d.get('arrival')}. جرب مدينتين كبار (تونس، صفاقس، سوسة…)."}[lang]
    det = []
    if d.get("carburant"):
        det.append({"fr": "carburant", "en": "fuel", "ar": "كازوال"}[lang] + f" {d['carburant']:.0f}")
    if d.get("peage"):
        det.append({"fr": "péage", "en": "tolls", "ar": "بياج"}[lang] + f" {d['peage']:.0f}")
    details = f" ({', '.join(det)} TND)" if det else ""
    return {"fr": f"💰 Estimation IA pour {d['departure']} → {d['arrival']} : **{d['prix']:.0f} TND** — {d['distanceKm']:.0f} km, ~{d['dureeH']:.1f} h{details}.\nC'est une estimation : le devis final est confirmé par notre équipe après votre demande de réservation.",
            "en": f"💰 AI estimate for {d['departure']} → {d['arrival']}: **{d['prix']:.0f} TND** — {d['distanceKm']:.0f} km, ~{d['dureeH']:.1f} h{details}.\nThis is an estimate: the final quote is confirmed by our team after your booking request.",
            "ar": f"💰 التقدير متاع {d['departure']} → {d['arrival']}: **{d['prix']:.0f} دينار** — {d['distanceKm']:.0f} كم، ~{d['dureeH']:.1f} ساعة{details}.\nهذا تقدير: السوم النهائي يأكدو الفريق بعد ما تبعث طلب الحجز."}[lang]


def fmt_my_profile(d: dict, lang: str) -> str:
    nom = f"{d.get('prenom') or ''} {d.get('nom') or ''}".strip() or d.get("email", "")
    return {"fr": f"👤 Vous êtes connecté en tant que **{nom}** ({d.get('role')}) — {d.get('email')}" + (f" · 📞 {d['telephone']}" if d.get("telephone") else ""),
            "en": f"👤 You are logged in as **{nom}** ({d.get('role')}) — {d.get('email')}" + (f" · 📞 {d['telephone']}" if d.get("telephone") else ""),
            "ar": f"👤 إنت داخل بحساب **{nom}** ({d.get('role')}) — {d.get('email')}" + (f" · 📞 {d['telephone']}" if d.get("telephone") else "")}[lang]


def fmt_password_reset(d: dict, lang: str) -> str:
    return {"fr": f"C'est fait ✅ Si un compte existe pour {d['email']}, un email de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.",
            "en": f"Done ✅ If an account exists for {d['email']}, a reset email has just been sent. Check your spam folder too.",
            "ar": f"تبعث ✅ كان فما حساب بالإيميل {d['email']}، وصلك إيميل باش تبدل الكود. شوف زادة في الspam."}[lang]


def fmt_fleet_overview(d: dict, lang: str) -> str:
    ms, vs = d.get("missionsParStatut", {}), d.get("vehiculesParStatut", {})
    l1 = {"fr": f"📊 Missions ({d.get('missionsTotal', 0)}) : ", "en": f"📊 Missions ({d.get('missionsTotal', 0)}): ",
          "ar": f"📊 المهمات ({d.get('missionsTotal', 0)}): "}[lang]
    l1 += " · ".join(f"{_st(k, lang)} {v}" for k, v in sorted(ms.items()))
    if vs:
        l2 = {"fr": "🚛 Flotte : ", "en": "🚛 Fleet: ", "ar": "🚛 الأسطول: "}[lang]
        l2 += " · ".join(f"{k.replace('_', ' ').lower()} {v}" for k, v in sorted(vs.items()))
        return l1 + "\n" + l2
    return l1


FORMATTERS: dict[str, Any] = {
    "my_missions": fmt_my_missions,
    "my_quotations": fmt_my_quotations,
    "where_is_my_truck": fmt_where_is_my_truck,
    "price_estimate": fmt_price_estimate,
    "my_profile": fmt_my_profile,
    "password_reset": fmt_password_reset,
    "fleet_overview": fmt_fleet_overview,
}

FOLLOWUPS = {"price_estimate": ASK_CITIES, "password_reset": ASK_EMAIL}
