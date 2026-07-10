# 👤 Page Profil backoffice — 100 % dynamique — `/users/profile`

## Le problème

La page profil (`http://localhost:3000/users/profile`) mélangeait données réelles et
**sections statiques du template** (en anglais, avec de fausses personnes) :

| Section | Avant |
|---|---|
| « My Team Members » | 6 faux employés codés en dur (Michael Zenaty, Sarah Johnson…) avec avatars du template |
| « Upcoming Reminders » | 5 faux rappels de février 2025 (« Meet Manager », « Client Presentation »…) |
| Fil de commentaires | Faux posts anglais (« Adam Jansen », « Wow impressive! ») + formulaire factice |
| « Compétences Certifiées » | 4 badges codés en dur (HVAC, Diagnostic pannes…) |
| Champs vides | Faux défauts : « Direction Maintenance », « Siège Social », « Maintenance Générale » |

## Ce qui a été fait — tout est réel maintenant

### `Members.tsx` → « Mon équipe »
- `userService.getAllUsers()` (IAM.API `/user-management`) : collègues **actifs** réels
  (hors clients, hors soi-même), photo réelle ou initiales, rôle, bouton **Contacter** (mailto).
- L'endpoint est réservé ADMIN/ADMINISTRATEUR/GESTIONNAIRE : pour les autres rôles,
  la carte **se masque d'elle-même** (pas d'erreur affichée).
- Lien « Tous les comptes » → `/users`.

### `Reminders.tsx` → « Missions à venir »
- `missionService.getAll()` (Mission.API) : les 5 prochaines missions EN_ATTENTE /
  EN_COURS triées par date de départ — n°, destination, date, statut, chauffeur.
- Pastille de couleur par statut, lien « Toutes les missions » → `/gestion/missions`.

### `Comments.tsx` → « Activité récente du compte »
- `authService.getLoginHistory(8)` (IAM.API `/auth/security/login-history`) :
  connexions réelles de l'utilisateur — réussite/échec, navigateur + OS (user-agent
  décodé), IP, méthode MFA, temps relatif en français (« il y a 3 h »).
- Rappel sécurité avec lien vers `/security` (page MFA).

### `ProfileCard.tsx` (déjà dynamique) — nettoyée
- Badges « Compétences » codés en dur → **« Domaines & affectations »** construits
  depuis les vraies données du profil (spécialité, département, site) ; section
  masquée si vide.
- Nouvelle section **« À propos »** affichant la bio réelle (si renseignée).
- Faux défauts supprimés : les champs vides affichent honnêtement « Non renseigné »
  (plus de « Direction Maintenance » / « Siège Social » inventés).

### Divers
- `data.ts` (fausses données du template) **supprimé** — plus aucune importation.
- Nouveau `helpers.ts` partagé : temps relatif FR, URL photos, initiales,
  décodage user-agent — logique séparée des composants (projet organisé).
- Titre de page : « Profile » → **« Mon profil »**.
- La page d'édition (`/users/profile/edit`) était déjà dynamique et en français
  (formulaire complet branché sur `profileService.updateProfile`).

## Fichiers modifiés

```
frontend/backoffice/src/app/(admin)/users/profile/
├── page.tsx                       # titre FR
├── helpers.ts                     # [nouveau] helpers partagés
├── data.ts                        # [supprimé] fausses données template
└── components/
    ├── ProfileCard.tsx            # badges dynamiques + bio + défauts honnêtes
    ├── Members.tsx                # réécrit — équipe réelle (IAM.API)
    ├── Reminders.tsx              # réécrit — missions réelles (Mission.API)
    └── Comments.tsx               # réécrit — historique de connexion réel (IAM.API)
```

## Comment tester

```bash
docker compose build backoffice && docker compose up -d backoffice
```
1. Se connecter sur `http://localhost:3000` (compte staff) → menu Users → Profile.
2. **Mon équipe** : les vrais comptes actifs de la base (avec un rôle non-admin, la carte disparaît).
3. **Missions à venir** : créer une mission → elle apparaît, triée par date de départ.
4. **Activité récente** : se déconnecter/reconnecter → la connexion apparaît en tête
   (avec navigateur, IP, MFA le cas échéant).
5. Vider `specialite`/`site` d'un compte → badges masqués et « Non renseigné » affichés.
