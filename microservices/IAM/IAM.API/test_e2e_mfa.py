"""E2E du système MFA (FICHE Authentication & Security) — run: python test_e2e_mfa.py

Parcours complet contre la stack Docker (IAM.API :5001 + PostgreSQL) :
  register → confirm email → login simple → activation Authenticator (TOTP)
  → re-login (challenge MFA) → verify TOTP → refresh token → email OTP
  → historique de connexions → nettoyage.

Le code TOTP est calculé côté test (RFC 6238, stdlib uniquement) à partir du
secret Base32 retourné par le setup — exactement comme Google Authenticator.
"""

import base64
import hashlib
import hmac
import json
import struct
import subprocess
import time
import urllib.error
import urllib.request
import uuid

BASE = "http://localhost:5001/api"
TEST_EMAIL = f"mfa-e2e-{uuid.uuid4().hex[:8]}@test.tn"
TEST_PASSWORD = "Test#Mfa2026!"

TOKEN = None


def call(method, path, body=None, token=None, expect_error=False):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else b"" if method == "POST" else None,
        method=method,
        headers={"Content-Type": "application/json",
                 **({"Authorization": f"Bearer {token}"} if token else {})})
    try:
        with urllib.request.urlopen(req) as res:
            payload = json.loads(res.read() or b"null")
            return res.status, (payload.get("data") if isinstance(payload, dict) and "data" in payload else payload)
    except urllib.error.HTTPError as e:
        if not expect_error:
            raise AssertionError(f"{method} {path} → HTTP {e.code}: {e.read()[:300]}")
        return e.code, json.loads(e.read() or b"null")


def totp(secret_b32: str, offset_steps: int = 0) -> str:
    """RFC 6238 — identique à Google Authenticator (30 s, 6 chiffres, SHA1)."""
    key = base64.b32decode(secret_b32 + "=" * (-len(secret_b32) % 8))
    step = int(time.time()) // 30 + offset_steps
    msg = struct.pack(">Q", step)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    o = digest[-1] & 0x0F
    code = (struct.unpack(">I", digest[o:o + 4])[0] & 0x7FFFFFFF) % 1_000_000
    return f"{code:06d}"


def psql(sql: str) -> str:
    out = subprocess.run(
        ["docker", "exec", "xpark-postgres", "psql", "-U", "xpark_user",
         "-d", "xpark_gmao", "-t", "-A", "-c", sql],
        capture_output=True, text=True)
    return out.stdout.strip()


# ── 1. Register + confirm email (parcours FICHE §1.2 « utilisateur nouveau ») ─
status, res = call("POST", "/auth/register", {
    "nom": "Test", "prenom": "MFA", "email": TEST_EMAIL,
    "password": TEST_PASSWORD, "confirmPassword": TEST_PASSWORD,
    "telephone": "20000000", "role": 1})
assert res["requiresEmailConfirmation"], res
confirm_token = psql(f"SELECT \"EmailConfirmationToken\" FROM \"Utilisateurs\" WHERE \"Email\"='{TEST_EMAIL}'")
assert confirm_token, "token de confirmation introuvable"
call("POST", f"/auth/confirm-email?email={TEST_EMAIL}&token={confirm_token}")
print(f"1. Compte créé + email confirmé: {TEST_EMAIL}")

# ── 2. Login SANS MFA → jetons directs ────────────────────────────────────────
status, auth = call("POST", "/auth/login", {"email": TEST_EMAIL, "password": TEST_PASSWORD})
assert auth["token"] and not auth.get("requiresMfa"), auth
TOKEN = auth["token"]
REFRESH = auth["refreshToken"]
print("2. Login sans MFA: JWT + refresh token délivrés directement")

# ── 3. Setup Authenticator: secret + QR, puis confirmation avec code TOTP ────
status, setup = call("POST", "/auth/mfa/authenticator/setup", token=TOKEN)
assert setup["secret"] and setup["qrCodeDataUri"].startswith("data:image/png;base64,")
assert setup["otpAuthUri"].startswith("otpauth://totp/XPARK")
print(f"3. Setup Authenticator: secret Base32 ({len(setup['secret'])} car.) + QR code PNG généré")

# Mauvais code → refusé
status, err = call("POST", "/auth/mfa/authenticator/confirm", {"code": "000000"},
                   token=TOKEN, expect_error=True)
assert status in (400, 401), status
# Bon code (calculé comme le ferait l'app Authenticator)
status, settings = call("POST", "/auth/mfa/authenticator/confirm",
                        {"code": totp(setup["secret"])}, token=TOKEN)
assert settings["authenticatorEnabled"] and settings["mfaRequired"], settings
print("4. Code TOTP vérifié → MFA Authenticator ACTIVÉ (mauvais code refusé avant)")

# ── 4. Re-login → challenge MFA (pas de jetons avant le 2e facteur) ──────────
status, challenge = call("POST", "/auth/login", {"email": TEST_EMAIL, "password": TEST_PASSWORD})
assert challenge["requiresMfa"] is True, challenge
assert challenge["token"] == "", "aucun JWT ne doit être délivré avant le 2e facteur"
assert "AUTHENTICATOR" in challenge["mfaMethods"]
assert challenge["mfaToken"], "jeton MFA pending manquant"
print(f"5. Re-login: challenge MFA déclenché (méthodes {challenge['mfaMethods']}), JWT retenu")

# Le jeton pending ne doit PAS passer les endpoints protégés
status, _ = call("GET", "/auth/mfa/settings", token=challenge["mfaToken"], expect_error=True)
assert status == 401, "le jeton MFA pending ne doit pas donner accès à l'API"
print("6. Jeton pending correctement limité (401 sur les endpoints protégés)")

# Mauvais code → refusé ; bon code → vrais jetons
status, err = call("POST", "/auth/mfa/verify",
                   {"mfaToken": challenge["mfaToken"], "method": "AUTHENTICATOR", "code": "123456"},
                   expect_error=True)
assert status == 401, status
status, auth2 = call("POST", "/auth/mfa/verify",
                     {"mfaToken": challenge["mfaToken"], "method": "AUTHENTICATOR",
                      "code": totp(setup["secret"])})
assert auth2["token"] and auth2["refreshToken"], auth2
TOKEN = auth2["token"]
print("7. Vérification TOTP: JWT + refresh token délivrés après le 2e facteur")

# ── 5. Refresh token ──────────────────────────────────────────────────────────
status, refreshed = call("POST", "/auth/refresh-token", {"refreshToken": auth2["refreshToken"]})
assert refreshed["token"] and refreshed["refreshToken"] != auth2["refreshToken"]
TOKEN = refreshed["token"]
print("8. Refresh token: rotation OK (nouveau access + nouveau refresh)")

# ── 6. Email OTP: activer, login, lire le code depuis les logs (mode DEV) ────
status, settings = call("POST", "/auth/mfa/email/toggle", token=TOKEN)
assert settings["emailOtpEnabled"], settings
status, challenge2 = call("POST", "/auth/login", {"email": TEST_EMAIL, "password": TEST_PASSWORD})
assert "EMAIL" in challenge2["mfaMethods"] and "AUTHENTICATOR" in challenge2["mfaMethods"]
# L'utilisateur choisit la méthode EMAIL → le code est envoyé (comme dans l'UI)
call("POST", "/auth/mfa/email/resend", {"mfaToken": challenge2["mfaToken"]})
time.sleep(1)
logs = subprocess.run(["docker", "logs", "--tail", "50", "xpark-iam-api"],
                      capture_output=True, text=True).stdout + \
       subprocess.run(["docker", "logs", "--tail", "50", "xpark-iam-api"],
                      capture_output=True, text=True).stderr
otp_lines = [l for l in logs.splitlines() if "[DEV] Code OTP MFA" in l and TEST_EMAIL in l]
assert otp_lines, "code OTP introuvable dans les logs (mode DEV)"
email_code = otp_lines[-1].split(":")[-2].split()[-1] if False else \
    [w for w in otp_lines[-1].replace(":", " ").split() if w.isdigit() and len(w) == 6][-1]
status, auth3 = call("POST", "/auth/mfa/verify",
                     {"mfaToken": challenge2["mfaToken"], "method": "EMAIL", "code": email_code})
assert auth3["token"], auth3
print(f"9. Email OTP: code {email_code} vérifié → connexion réussie (2 méthodes MFA actives)")

# ── 7. Historique + audit ─────────────────────────────────────────────────────
status, history = call("GET", "/auth/security/login-history", token=auth3["token"])
assert len(history) >= 3, history
methods = {(h["mfaMethod"], h["isSuccessful"]) for h in history}
assert ("AUTHENTICATOR", True) in methods and ("EMAIL", True) in methods
assert any(not h["isSuccessful"] for h in history), "les échecs doivent être tracés"
audit_count = psql(f"SELECT COUNT(*) FROM \"AuthAuditLogs\" a JOIN \"Utilisateurs\" u ON u.\"IdUtilisateur\"=a.\"UserId\" WHERE u.\"Email\"='{TEST_EMAIL}'")
assert int(audit_count) >= 4, f"audit insuffisant: {audit_count}"
print(f"10. Historique: {len(history)} connexions tracées (succès+échecs), {audit_count} entrées d'audit")

# ── 8. Nettoyage ──────────────────────────────────────────────────────────────
uid = psql(f"SELECT \"IdUtilisateur\" FROM \"Utilisateurs\" WHERE \"Email\"='{TEST_EMAIL}'")
for table, col in [("UserMfaSettings", "UserId"), ("EmailOtps", "UserId"),
                   ("LoginHistory", "UserId"), ("AuthAuditLogs", "UserId")]:
    psql(f'DELETE FROM "{table}" WHERE "{col}"={uid}')
psql(f'DELETE FROM "Utilisateurs" WHERE "IdUtilisateur"={uid}')
print(f"11. Compte de test supprimé (userId={uid})")

print("\nALL MFA E2E TESTS PASSED")
