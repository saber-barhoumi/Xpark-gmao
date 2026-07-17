# Voix & langues — fr / en / darija, sans réglage manuel

## Détection de langue (texte)

`app/agent/language.py` — détecteur maison optimisé pour les messages COURTS
du chat (les librairies statistiques échouent sous 5 mots) :

1. **Écriture arabe** → `ar` (darija écrite en arabe) ;
2. **Darija romanisée (arabizi)** : lexique fusionné = noyau manuel certifié
   (poids 2) + ~800 mots extraits du corpus réel CleanData de 23 000
   commentaires tunisiens (poids 0,5, car bruité) + chiffres-lettres 3/7/9
   (« 3andi », « s7a », « 9adech ») ;
3. sinon score de mots-outils **français vs anglais** (le français gagne à
   égalité : marché tunisien).

La détection est **par message** : l'utilisateur peut changer de langue au
milieu de la conversation, Ayshaa suit sans bouton. La réponse (RAG, outil ou
persona) est produite dans la langue détectée — y compris les gabarits d'outils
(`prompts/tool_answers.py`) qui existent dans les 3 langues.

## Pipeline vocal

**Choix d'architecture** : STT et TTS s'exécutent **dans le navigateur**
(Web Speech API). Zéro latence serveur, zéro coût GPU, aucune donnée audio ne
quitte le poste (RGPD). Le serveur reste l'autorité sur la langue (détection
texte sur la transcription) et publie la configuration via
`GET /api/v1/speech/config` (`app/speech/config.py`) : locales STT, voix TTS
préférées par langue, modes disponibles. Brancher un STT serveur (Whisper) ou
un TTS neuronal plus tard = un nouveau provider dans `app/speech/`, le widget
ne change pas.

### Entrée voix (STT)
- Locales : `fr-FR`, `en-US`, `ar-TN` (repli `ar-SA`/`ar-EG`).
- **Adaptative** : le micro utilise la locale de la **dernière langue détectée
  par le serveur** — parlez français puis anglais, le micro suit.
- La transcription passe par le même agent que le texte (mêmes outils, même
  RAG) : dire « où est mon camion » appelle bien le GPS.

### Sortie voix (TTS)
- La voix suit **la langue de la réponse** : contenu en écriture arabe → voix
  arabe ; réponse latine → langue détectée (une voix arabe ne sait pas lire du
  texte latin → repli français).
- Sélection de la meilleure voix disponible : locale exacte (`ar-TN`) → même
  langue (`ar-*`) ; nettoyage des emojis/markdown avant lecture (naturel, pas
  robotique).

### Modes de restitution (bouton cyclique du widget, persisté)
| Mode | Icône | Comportement |
|---|---|---|
| `text` | 💬 | réponse écrite, silencieuse (défaut) |
| `both` | 🔊 | écrite **et** lue à voix haute |
| `voice` | 🎧 | lue à voix haute **et le micro se rouvre automatiquement** quand Ayshaa a fini de parler → **conversation mains-libres** |

## Fichiers

- `app/agent/language.py` — détection + normalisation arabe + expansion
  arabizi→arabe pour BM25 (« chhal el prix » retrouve la KB en écriture arabe).
- `app/speech/config.py` — configuration servie au widget.
- `frontend/frontoffice/components/assistant/AyshaaWidget.js` — STT/TTS,
  modes, RTL automatique.
- `scripts/build_darija_lexicon.py` — reconstruction du lexique darija depuis
  le corpus.

## Tests

`tests/test_language.py` (détection), `tests/test_router.py` (motifs darija
« win el camion », « ch7al ») — 37 tests au total, tous sans réseau.
