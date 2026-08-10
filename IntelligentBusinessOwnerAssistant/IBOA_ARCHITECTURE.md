# IBOA — Assistant de surveillance d'exploitation

> Documentation technique du service `IntelligentBusinessOwnerAssistant`.
> Port **5008** · Tableau de bord : `http://localhost:3000/monitoring/iboa`

Ce document explique **pourquoi** le service se comporte comme il le fait, pas
seulement comment il est écrit. Chaque règle est accompagnée du raisonnement
qui l'a fait choisir et, quand c'est vérifiable, de la mesure qui l'appuie.

---

## 1. Ce que le service résout

Un exploitant de flotte ne peut pas rester devant un écran. Les faits qui
appellent une décision — une panne, une assurance expirée, une facture qui
traîne — se produisent pendant qu'il conduit, négocie ou charge un camion.

IBOA écoute **tout ce que produisent les autres services**, évalue la gravité
de chaque fait, et n'en pousse vers l'extérieur que ce qui mérite d'interrompre
quelqu'un. Le reste est consigné et consultable.

La difficulté n'est pas de savoir envoyer un courriel. Elle est de **décider
quand se taire** : un système qui alerte trop finit ignoré, et devient alors
plus nuisible que l'absence de système.

---

## 2. Le parcours d'un fait, de bout en bout

```
  Services métier (.NET et Python)
        │  publient sur l'échange « xpark.ai », clés « xpark.* »
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 1. Réception        rabbitmq_consumer.py                 │
  │    file durable « iboa.events », liaison « xpark.# »     │
  ├─────────────────────────────────────────────────────────┤
  │ 2. Normalisation    pipeline.normalize()                 │
  │    accepte le format standard ET les charges brutes      │
  ├─────────────────────────────────────────────────────────┤
  │ 3. Enrichissement   storage.count_similar_events()       │
  │    combien de fois ce problème sur cet objet en 7 jours  │
  ├─────────────────────────────────────────────────────────┤
  │ 4. Notation         scorer.score_event()      → 1 à 100  │
  ├─────────────────────────────────────────────────────────┤
  │ 5. Arbitrage        aggregator.decide()                  │
  │    SEND_NOW · BATCH · SUPPRESS_DUPLICATE · DAILY_ONLY    │
  ├─────────────────────────────────────────────────────────┤
  │ 6. Mise en forme    formatters.py + assets/              │
  ├─────────────────────────────────────────────────────────┤
  │ 7. Envoi            delivery.py   courriel · WhatsApp    │
  ├─────────────────────────────────────────────────────────┤
  │ 8. Traçabilité      storage.py    PostgreSQL partagé     │
  └─────────────────────────────────────────────────────────┘
```

Le service **ne consulte aucun autre service**. Il ne fait qu'écouter. C'est
le seul de la plateforme dont le point d'entrée principal est un message et
non une requête ; son interface web ne sert qu'à relire ce qu'il a consigné.

---

## 3. La notation de gravité

### 3.1 Comment un score se construit

```
score = base(type d'événement) + modificateurs, borné à [1, 100]
```

**La base** dépend du type de fait. Une quarantaine de types sont répertoriés
dans `scorer.BASE_SCORES` ; un type inconnu vaut 30 par défaut, ce qui le place
en « à suivre » sans jamais le faire disparaître.

| Exemples de base | |
|---|---|
| `xpark.finance.cash-flow-critical` | 90 |
| `xpark.finance.profit-decreased` | 80 |
| `xpark.mission.task-failed` | 75 |
| `xpark.fleet.vehicle-breakdown` | 70 |
| `xpark.fleet.insurance-expired` | 60 |
| `xpark.fleet.maintenance-due` | 45 |
| `xpark.mission.task-completed` | 15 |

**Les modificateurs** traduisent le contexte :

| Facteur | Points | Code interne |
|---|---|---|
| Gravité déclarée HIGH / CRITICAL | +10 / +20 | `GRAVITE_ELEVEE` |
| Une mission en cours est touchée | +20 | `MISSION_ACTIVE` |
| Le client est prioritaire (PREMIUM/VIP) | +15 | `CLIENT_VIP` |
| Incidence financière supérieure à 500 TND | +10 | `COUT_ELEVE` |
| Trois faits semblables ou plus en 7 jours | +5 | `RECURRENCE` |
| Recul de plus de 20 % (rentabilité) | +15 | `BAISSE_MARQUEE` |
| Trésorerie sous 5 000 TND | +20 | `TRESORERIE_BASSE` |

### 3.2 Deux lectures d'un même calcul

`score_event()` produit **deux sorties pour un seul calcul** :

- `scoreBreakdown` — le détail chiffré (`Base xpark.fleet.vehicle-breakdown: +70`,
  `Mission active impactée: +20`…). Il est stocké en base et affiché au
  tableau de bord : il permet de **vérifier** un score ligne à ligne.
- `severityFactors` — les codes ci-dessus. Ils servent à écrire la phrase
  métier du courriel (« une mission en cours est directement affectée »).

Ce n'est pas une duplication : c'est **le même calcul, exposé à deux publics**.
Un exploitant n'a pas à lire une addition ; un examinateur doit pouvoir la
refaire.

### 3.3 Les quatre niveaux

| Score | Niveau interne | Libellé affiché |
|---|---|---|
| 85 à 100 | `CRITIQUE` | Traitement immédiat |
| 60 à 84 | `IMPORTANT` | Important |
| 30 à 59 | `NORMAL` | À suivre |
| 1 à 29 | `INFO` | Pour information |

---

## 4. Les seuils de déclenchement

### 4.1 Deux seuils, deux canaux

Réglables dans l'onglet « Préférences » du tableau de bord, persistés dans la
table `IboaPreferences` :

| Réglage | Défaut | Effet |
|---|---|---|
| `emailThreshold` | **60** | à partir de ce score, un courriel part |
| `whatsappThreshold` | **85** | à partir de ce score, un message WhatsApp part aussi |

Les deux canaux sont **cumulatifs et indépendants** : un fait à 90 déclenche un
courriel *et* un WhatsApp ; un fait à 70 ne déclenche qu'un courriel.

### 4.2 Pourquoi 60 et 85, et pas l'inverse

Le courriel se consulte quand on veut : il peut donc porter tout ce qui mérite
une décision dans la journée — d'où un seuil placé à la frontière du niveau
« Important ».

WhatsApp interrompt. Il est réservé à ce qui ne peut pas attendre la prochaine
ouverture de la boîte : le seuil est aligné sur la frontière du niveau
« Traitement immédiat ».

Placer WhatsApp à 60 reviendrait à faire vibrer un téléphone pour une
assurance qui expire dans trois semaines. C'est ainsi qu'un système d'alerte
se fait couper.

### 4.3 Ce n'est pas 100 — mesure à l'appui

Un score de 100 n'a rien de nécessaire. Vérification faite sur la plateforme,
en injectant trois faits de types différents :

| Fait injecté | Score | Niveau | Canal | Statut |
|---|---|---|---|---|
| Facture impayée | **75** | Important | Courriel | `SENT` |
| Mission échouée | **75** | Important | Courriel | `SENT` |
| Assurance expirée | **70** | Important | Courriel | `SENT` |

Le journal d'audit conserve par ailleurs la trace d'un fait à **80** ayant
reçu la décision `SEND_NOW` :

```sql
SELECT "Details"->>'score', "Details"->>'decision'
FROM "IboaAuditLog" WHERE "Action" = 'DECISION'
  AND ("Details"->>'score')::int >= 60;
```

**Si vous n'observez des courriels qu'à 100/100**, la cause n'est pas le
seuil : c'est que le bouton de test du tableau de bord envoie toujours le même
scénario de démonstration — panne majeure, mission active, client prioritaire —
dont le total dépasse 100 et se trouve borné. Injectez un autre type
d'événement pour le constater.

---

## 5. Les règles anti-saturation

Quatre règles, appliquées dans cet ordre par `aggregator.decide()`.

### R1 — Déduplication, fenêtre de 15 minutes

Un même couple **(type d'événement, objet concerné)** ne déclenche qu'une
alerte par quart d'heure. Au-delà, la décision est `SUPPRESS_DUPLICATE` :
l'événement reste enregistré et visible au tableau de bord, mais rien ne part.

L'objet est identifié par `scorer.object_key()`, qui retient la première clé
présente parmi `vehicleId`, `missionId`, `clientId`, `employeeId`,
`invoiceId`, `batchId`, et retombe sinon sur `global`.

> **Pourquoi.** Un capteur qui signale une panne toutes les trente secondes ne
> décrit qu'une seule panne. Sans cette règle, la première vraie alerte serait
> noyée dans ses propres répétitions.

> **Conséquence à connaître pour les démonstrations.** Le bouton de test envoie
> toujours `vehicleId=45`. Le **deuxième clic dans le quart d'heure n'envoie
> rien** — c'est le comportement attendu, pas une panne. Pour relancer :
> changer de type d'événement, attendre quinze minutes, ou redémarrer le
> conteneur (la mémoire de déduplication est en RAM, elle ne survit pas au
> redémarrage).

### R2 — Regroupement thématique

Trois faits du **même type** en trente minutes, hors niveau critique : les
suivants basculent en résumé groupé plutôt qu'en alertes séparées.

### R3 — Acheminement par niveau

| Niveau | Traitement |
|---|---|
| `CRITIQUE` | envoi immédiat, jamais regroupé |
| `IMPORTANT` | envoi immédiat |
| `NORMAL` | résumé groupé horaire |
| `INFO` | rapport quotidien seulement, aucun envoi |

### R4 — Garde-fou de fatigue

Au-delà de `maxAlertsPerDay` (20 par défaut), tout bascule en résumé groupé —
**sauf le niveau critique**, qui passe toujours.

---

## 6. Les heures calmes

Réglage `quietHoursStart` / `quietHoursEnd`, **22 h → 7 h** par défaut.

Pendant cette plage, un fait de niveau autre que critique ne déclenche pas de
courriel immédiat : il rejoint le résumé groupé. Le niveau critique, lui,
passe à toute heure.

```python
if scored.criticityScore >= prefs.emailThreshold:
    if quiet and scored.classification != "CRITIQUE":
        → mis en attente dans le résumé
    else:
        → envoi immédiat
```

L'heure prise en compte est celle du conteneur. Le calcul gère la plage à
cheval sur minuit : `22 ≤ h` **ou** `h < 7`.

---

## 7. Le courriel : structure et assets

### 7.1 Où vit quoi

```
IntelligentBusinessOwnerAssistant/
├── assets/
│   ├── charte.css      couleurs de la charte — source unique
│   ├── alerte.html     gabarit d'une alerte
│   ├── resume.html     gabarit du résumé groupé
│   ├── libelles.json   traduction métier des champs et des événements
│   └── logo.png        logo joint au message
├── templates.py        seul pont entre le code et assets/
├── formatters.py       assemble les données, ne contient aucune balise
└── delivery.py         envoie, joint le logo, réessaie
```

**Aucun fichier Python ne contient de HTML, de couleur ni de libellé français.**
Corriger une formulation, une couleur ou un intitulé de colonne se fait dans
`assets/`, sans toucher au code.

### 7.2 Pourquoi les styles sont en ligne dans le HTML

Un courriel ne peut pas charger de feuille de style : Gmail et Outlook
suppriment les balises `<link>`, et Outlook pour Windows ignore une large part
de ce qui se trouve dans `<style>`. Le seul style fiable est celui porté par
l'attribut `style` de chaque balise.

Les couleurs ne sont pourtant définies qu'**une seule fois**, dans
`assets/charte.css`. `templates.py` en extrait les déclarations `--nom: valeur;`
et les substitue dans les gabarits au moment du rendu : là où un gabarit écrit
`{{couleur-accent}}`, la valeur du fichier CSS est injectée.

Le fichier reste un CSS valide, relisible et colorisé par n'importe quel
éditeur ; il sert de table de correspondance plutôt que de feuille de style.

### 7.3 Pourquoi le logo est joint et non lié

Gmail bloque les images distantes tant que le destinataire ne les autorise pas,
et refuse purement et simplement les images encodées dans l'adresse (`data:`).
Le logo est donc **joint au message** et appelé par `cid:xpark-logo`, ce qui
impose l'emboîtement suivant :

```
multipart/related
  ├── multipart/alternative → le corps HTML
  └── image/png             → le logo, Content-ID « xpark-logo »
```

Un logo introuvable n'empêche pas l'alerte de partir : l'envoi se poursuit
sans en-tête visuel, avec un avertissement au journal.

### 7.4 Contenu d'une alerte

| Bloc | Source |
|---|---|
| Bandeau de priorité | `libelles.json → priorites` |
| Titre et situation | `libelles.json → evenements` |
| Tableau des données | `libelles.json → champs`, appliqué à `eventData` |
| « Pourquoi ce niveau » | `libelles.json → facteurs`, appliqué à `severityFactors` |
| « Action recommandée » | `libelles.json → evenements → action` |

Les champs d'implémentation (`batchId`, `executionTimeMs`, `correlationId`…)
sont listés dans `champsIgnores` et ne sont jamais montrés. Un champ non
traduit est tout de même affiché, sous un intitulé lisible, plutôt que de
laisser un trou.

Un type d'événement inconnu ne fait pas échouer l'envoi : son nom technique est
rendu lisible et des phrases génériques prennent le relais. Ajouter un
événement côté serveur n'oblige donc pas à toucher au formateur.

---

## 8. Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `RABBITMQ_HOST` / `USER` / `PASS` | `rabbitmq` / `xpark` / `xpark_secret` | bus d'événements |
| `DATABASE_URL` | base partagée `xpark_gmao` | persistance |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` / `FROM` | vide → simulation | envoi des courriels |
| `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN` / `WHATSAPP_FROM` | vide → simulation | envoi WhatsApp |
| `IBOA_BATCH_INTERVAL_MIN` | 60 | fréquence du résumé groupé |
| `IBOA_DASHBOARD_URL` | `http://localhost:3000/monitoring/iboa` | lien du bouton d'action |

**Noms de variables.** `delivery.py` lit `SMTP_USER` et `SMTP_PASS`, non
`SMTP_USERNAME` ni `SMTP_PASSWORD`. Une erreur sur ces noms ne provoque aucune
erreur visible : le service retombe silencieusement en simulation.

**Mode simulation.** Sans identifiants, les messages sont écrits au journal et
l'alerte est enregistrée avec le statut `SENT_SIMULATED`. Le parcours complet
reste donc testable sans compte externe. `GET /health` indique le mode en
cours :

```json
{ "emailMode": "SMTP", "whatsappMode": "SIMULATION" }
```

**Sur le lien avec le service des identités.** Le courriel réutilise le compte
Gmail déjà configuré pour les codes à usage unique, via les clés `EMAIL_*` du
fichier `.env` de la racine. Aucun secret n'est dupliqué ni versionné.

**Expéditeur d'enveloppe.** `EMAIL_FROM` porte un nom d'affichage
(`XPARK GMAO <boîte@gmail.com>`). Cette forme convient à l'en-tête `From` mais
pas à la commande `MAIL FROM` du protocole, qui n'accepte qu'une adresse nue —
`delivery.py` l'extrait avec `parseaddr`. Sans cette séparation, le serveur
répond par une erreur de syntaxe et aucun message ne part.

---

## 9. Interface de programmation

| Point d'entrée | Rôle |
|---|---|
| `GET /health` | état du service, du bus, et mode de chaque canal |
| `GET /events?limit=` | faits notés récents |
| `GET /alerts?limit=` | alertes émises, avec canal, statut et contenu |
| `GET /stats` | compteurs du jour |
| `GET` / `PUT /preferences` | destinataires, seuils, heures calmes |
| `GET /reports/daily.pdf` | rapport quotidien |
| `GET /reports/daily.xlsx` | export tableur |
| `POST /test-event` | injecte un fait dans le bus réel |
| `POST /batch/flush` | force l'envoi du résumé groupé |
| `POST /events/delete`, `DELETE /events` | purge du flux |
| `POST /alerts/delete`, `DELETE /alerts` | purge de l'historique |

`POST /test-event` **publie dans le vrai bus** : le fait injecté suit
exactement le même parcours qu'un fait produit par un service métier. Ce n'est
pas un raccourci de démonstration.

---

## 10. Tests

```bash
python test_iboa.py       # notation, règles anti-saturation, mise en forme
python test_e2e_iboa.py   # bout en bout contre la pile Docker
```

Les tests de mise en forme vérifient **l'absence de jargon** autant que la
présence des intitulés : ils échouent si `xpark.fleet`, `TestConsole`,
`estimatedRepairCost` ou une addition de points réapparaissent dans un
courriel.

### Éprouver les seuils soi-même

```bash
curl -X POST http://localhost:5008/test-event \
  -H "Content-Type: application/json" \
  -d '{"eventType":"xpark.fleet.insurance-expired","severity":"HIGH",
       "eventData":{"vehicleId":77,"vehicleImmatriculation":"TN-5678-DEF"}}'
```

Score attendu : 60 + 10 = **70**, niveau Important, courriel envoyé, pas de
WhatsApp.

---

## 11. Questions fréquentes

**Le score peut-il dépasser 100 ?**
Le calcul, oui ; le résultat, non. `_clamp()` borne à [1, 100]. Le scénario de
démonstration totalise 115 avant bornage — c'est pourquoi il affiche toujours
100.

**Que se passe-t-il si RabbitMQ tombe ?**
Le consommateur se reconnecte indéfiniment, avec cinq secondes entre deux
tentatives. La file `iboa.events` est durable : les messages publiés pendant
l'interruption sont traités au retour.

**Que se passe-t-il si Gmail refuse un message ?**
Trois tentatives, espacées de 0, 5 et 15 secondes. En cas d'échec définitif,
l'alerte est enregistrée au statut `FAILED` avec le motif, visible au tableau
de bord.

**Un événement malformé peut-il arrêter le service ?**
Non. Il est journalisé puis acquitté, et la consommation continue.

**Pourquoi ne pas avoir utilisé un moteur de gabarits comme Jinja ?**
Les besoins se limitent à une substitution de marqueurs. Une dépendance
supplémentaire dans l'image, pour cela seul, ne se justifiait pas.

**Le service peut-il être dupliqué pour absorber la charge ?**
Pas en l'état : la mémoire de déduplication et la file de regroupement sont en
RAM, propres à chaque instance. Deux instances dédupliqueraient chacune de son
côté. Les porter en base ou dans un cache partagé est la première étape d'une
mise à l'échelle.

**Pourquoi la notation n'est-elle pas un modèle appris ?**
Pour la même raison que la maintenance prédictive : l'entreprise ne dispose pas
d'un historique annoté, et une alerte doit être **explicable**. Un exploitant
n'immobilise pas un véhicule sur la foi d'un score sans motif. Les règles sont
lisibles, discutables et corrigibles ; un modèle appris viendra quand il y aura
de quoi l'entraîner et de quoi le justifier.
