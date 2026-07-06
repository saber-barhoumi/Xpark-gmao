# Système d'Authentification & Sécurité XPARK — Documentation

> Implémente la `FICHE_TECHNIQUE_AUTHENTICATION_SECURITY` dans **IAM.API** (port 5001),
> le service qui possède déjà l'authentification : MFA multi-méthodes, jetons JWT +
> refresh avec rotation, historique de connexions et journal d'audit sécurité.

---

## 1. Ce qui existait déjà vs ce qui a été ajouté

| Brique (fiche) | État |
|---|---|
| Password hashing (BCrypt) + lockout force brute (5 essais → 15 min) | ✅ existait |
| Confirmation email, reset password, PIN, verrouillage session | ✅ existait |
| JWT signé + refresh token stocké | ✅ existait |
| **MFA Authenticator (TOTP)** — Google/Microsoft Authenticator, QR code | 🆕 **ajouté** |
| **MFA Email OTP** — code 6 chiffres haché, 10 min, 5 tentatives max | 🆕 **ajouté** |
| **Challenge MFA au login** — jeton « pending » 5 min avant les vrais JWT | 🆕 **ajouté** |
| **Rotation du refresh token + renouvellement silencieux** (front) | 🆕 **ajouté** |
| **LoginHistory** — succès/échecs, IP, User-Agent, méthode MFA | 🆕 **ajouté** |
| **AuthAuditLogs** — MFA_SETUP / MFA_ENABLED / MFA_VERIFIED / MFA_FAILED… | 🆕 **ajouté** |
| **Page Sécurité** backoffice (`/security`) + étape MFA au login | 🆕 **ajouté** |
| Passkeys WebAuthn, biométrie native, social login | ⏭️ phase 2 (semaines 3-5 de la fiche) |

## 2. Flux de connexion avec MFA (fiche §1.2)

```
1. POST /api/auth/login { email, password }
      │  mot de passe BCrypt OK, compte actif
      ▼
   MFA activé ?
      │ NON → JWT (60 min) + refresh token (7 j)         [comme avant]
      │ OUI ▼
2. Réponse { requiresMfa: true, mfaMethods: ["AUTHENTICATOR","EMAIL"],
             mfaToken: <jeton pending 5 min> }            [AUCUN vrai JWT]
      │  (si méthode par défaut EMAIL → code envoyé automatiquement)
      ▼
3. POST /api/auth/mfa/verify { mfaToken, method, code }
      │  TOTP RFC 6238 (fenêtre ±30 s) ou OTP email (haché BCrypt)
      ▼
4. JWT + refresh token délivrés · LoginHistory + audit enregistrés
```

**Sécurité du jeton pending** : claim `token_use=mfa_pending`, aucun rôle, 5 minutes —
il est refusé (401) par tous les endpoints `[Authorize]`, il ne sert QUE à `/mfa/verify`.

## 3. TOTP — implémentation

RFC 6238 implémenté directement sur `HMACSHA1` ([TotpService.cs](microservices/IAM.API/Services/TotpService.cs)) :
secret 160 bits Base32, pas de 30 s, 6 chiffres, fenêtre ±1 (tolérance horloge 60 s) —
identique à Google/Microsoft Authenticator. Le QR code (`otpauth://totp/XPARK:email?...`)
est généré côté serveur (QRCoder → PNG base64), aucune dépendance frontend.

Le secret n'est **actif qu'après confirmation** d'un premier code valide (un setup
abandonné ne verrouille jamais le compte).

## 4. Email OTP

- Code 6 chiffres, stocké **haché (BCrypt)** — jamais en clair en base
- Validité 10 minutes, **5 tentatives max**, un seul code actif à la fois
- **Mode DEV** : sans SMTP configuré (`Email:Host`), le code est écrit dans les logs
  du conteneur (`docker logs xpark-iam-api` → `[DEV] Code OTP MFA...`) pour la démo.
  En production, configurer SMTP dans docker-compose supprime ce comportement.

## 5. Refresh token & renouvellement silencieux

- Rotation à chaque usage : un refresh token consommé est remplacé (7 jours)
- Frontend ([axiosConfig.ts](frontend/backoffice/src/lib/axiosConfig.ts)) : sur 401,
  tentative silencieuse `POST /auth/refresh-token` puis **rejeu de la requête d'origine** ;
  échec → déconnexion classique. Une seule tentative par requête (anti-boucle).

## 6. Où le voir dans l'application ?

| Emplacement | Description |
|---|---|
| **Menu → « Sécurité (MFA) »** → `/security` | Cartes Authenticator + Email OTP (activer/désactiver), **modal QR code** de setup, historique des 20 dernières connexions (méthode, MFA, IP, succès/échec) |
| **Page de connexion** | Si MFA activé : étape 2 automatique — sélecteur de méthode, saisie 6 chiffres avec auto-validation, renvoi d'email avec compte à rebours |

**Parcours de démo** : se connecter → menu « Sécurité (MFA) » → « Configurer avec QR code »
→ scanner avec Google Authenticator → entrer le code → se déconnecter → se reconnecter :
l'étape de vérification apparaît.

## 7. Base de données (créée automatiquement au démarrage, SQL idempotent)

| Table | Contenu |
|---|---|
| `UserMfaSettings` | Méthodes activées, secret TOTP, méthode par défaut |
| `EmailOtps` | Codes OTP hachés + expiration + tentatives |
| `LoginHistory` | Chaque tentative de connexion (succès ET échecs) |
| `AuthAuditLogs` | Trail sécurité : MFA_CHALLENGE, MFA_VERIFIED, MFA_FAILED… |

## 8. Fichiers

### Backend — `microservices/IAM.API/`
| Fichier | Rôle |
|---|---|
| `Services/TotpService.cs` | TOTP RFC 6238 + Base32 + otpauth URI + QR (QRCoder) |
| `Services/MfaService.cs` | Settings, setup/confirm/disable, OTP email, historique, audit |
| `Services/JwtService.cs` | + jeton MFA pending (5 min, `token_use=mfa_pending`) |
| `Services/AuthService.cs` | Branche MFA du login + `VerifyMfaAsync` + traçage |
| `Services/EmailService.cs` | + template email OTP |
| `Entities/MfaEntities.cs` · `Data/IamDbContext.cs` · `Program.cs` | Entités + mapping + SQL idempotent |
| `Controllers/AuthController.cs` | 8 nouveaux endpoints (voir ci-dessous) |
| `test_e2e_mfa.py` | E2E complet rejouable |

### Frontend — `frontend/backoffice/src/`
| Fichier | Rôle |
|---|---|
| `app/(admin)/security/page.tsx` | Page Sécurité (MFA + historique) |
| `app/(other)/auth/login/page.tsx` | Étape 2 MFA au login |
| `services/authService.ts` | verifyMfa, setup/confirm/disable, historique |
| `lib/axiosConfig.ts` | Renouvellement silencieux du JWT sur 401 |

### Endpoints ajoutés (`/api/auth/…`)
```
POST mfa/verify                     échange jeton pending + code → vrais JWT
POST mfa/email/resend               renvoyer le code OTP pendant le challenge
GET  mfa/settings                   [Authorize] état MFA de l'utilisateur
POST mfa/authenticator/setup        [Authorize] secret + QR code
POST mfa/authenticator/confirm      [Authorize] active après 1er code valide
POST mfa/authenticator/disable      [Authorize]
POST mfa/email/toggle               [Authorize]
GET  security/login-history         [Authorize] 20 dernières connexions
```

## 9. Tester

```bash
docker compose up -d iam-api backoffice
python microservices/IAM.API/test_e2e_mfa.py     # E2E complet (register→MFA→refresh→cleanup)
```
Le test calcule les codes TOTP lui-même (RFC 6238, stdlib) à partir du secret —
exactement comme le ferait l'application Authenticator.

## 10. Phase 2 (planning fiche, semaines 3-5)

- **Passkeys WebAuthn** (Windows Hello, Face ID, Touch ID) : bibliothèque `Fido2NetLib` +
  `navigator.credentials` — fonctionne sur localhost, nécessite HTTPS en production
- **Biométrie native mobile** (expo-local-authentication) : pour l'app mobile
- **Social login** (Google/Facebook/GitHub) : OAuth2 + table SocialLogins
- **Codes de secours** (backup codes) : génération + usage unique
- **Argon2** à la place de BCrypt : la fiche le recommande ; BCrypt (coût 11) reste
  solide et déjà utilisé partout dans la base existante
