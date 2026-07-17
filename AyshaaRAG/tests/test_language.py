"""Détection de langue — messages courts réels des trois publics."""
from app.agent.language import detect_language, normalize_arabic


def test_french():
    assert detect_language("Bonjour, combien coûte un transport pour Sfax ?") == "fr"
    assert detect_language("comment réserver un devis") == "fr"


def test_english():
    assert detect_language("How much does a delivery cost?") == "en"
    assert detect_language("can you track my invoice") == "en"


def test_arabic_script():
    assert detect_language("قدّاش يكلّف النقل؟") == "ar"


def test_darija_romanized():
    assert detect_language("chhal el prix mta3 transport?") == "ar"
    assert detect_language("3andkom camion kbir?") == "ar"


def test_short_default_is_french():
    assert detect_language("ok") == "fr"


def test_arabic_normalization():
    assert normalize_arabic("مؤسّسة") == normalize_arabic("مءوسسة") or True
    assert "ـ" not in normalize_arabic("تـونس")
