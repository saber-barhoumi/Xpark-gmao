"""Small talk — les salutations ne doivent JAMAIS partir dans le RAG."""
from app.rag.language import detect_language
from app.rag.smalltalk import detect_intent, reply_smalltalk


def test_greetings_all_languages():
    assert detect_intent("Bonjour") == "greeting"
    assert detect_intent("bonjour !") == "greeting"
    assert detect_intent("Hello") == "greeting"
    assert detect_intent("hi") == "greeting"
    assert detect_intent("السلام عليكم") == "greeting"
    assert detect_intent("aslema") == "greeting"
    assert detect_intent("صباح الخير") == "greeting"


def test_how_are_you_and_thanks():
    assert detect_intent("ça va ?") == "how_are_you"
    assert detect_intent("how are you") == "how_are_you"
    assert detect_intent("لاباس ؟") == "how_are_you"
    assert detect_intent("merci beaucoup") == "thanks"
    assert detect_intent("يعيشك") == "thanks"
    assert detect_intent("3aychek") == "thanks"


def test_real_questions_are_not_smalltalk():
    assert detect_intent("Bonjour, combien coûte un transport ?") is None
    assert detect_intent("comment réserver un camion ?") is None
    assert detect_intent("قداش يكلف النقل؟") is None
    assert detect_intent("chhal el prix?") is None
    assert detect_intent("How much does delivery cost?") is None


def test_replies_are_localized():
    fr, sugg = reply_smalltalk("greeting", "fr")
    ar, _ = reply_smalltalk("greeting", "ar")
    en, _ = reply_smalltalk("greeting", "en")
    assert "Ayshaa" in fr or "XPARK" in fr
    assert "عيشة" in ar or "XPARK" in ar
    assert "Ayshaa" in en or "XPARK" in en
    assert sugg is True


def test_smalltalk_language_pairing():
    """La réponse doit être dans la langue de la salutation."""
    assert detect_language("Bonjour") == "fr"
    assert detect_language("hello") == "en"
    assert detect_language("السلام عليكم") == "ar"
    assert detect_language("aslema") == "ar"
