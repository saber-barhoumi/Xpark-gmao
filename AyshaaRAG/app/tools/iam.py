"""
Outils IAM.API — identité et compte de l'utilisateur.

  GET  /api/auth/profile           → profil de l'utilisateur connecté
  POST /api/auth/recover-password  → email de réinitialisation (flux existant
                                     du portail, Ayshaa ne voit JAMAIS de mot
                                     de passe — elle déclenche l'email officiel)
"""
from __future__ import annotations

from app.config import get_settings
from app.tools.base import ToolContext, ToolResult, api_get, api_post


class MyProfileTool:
    name = "my_profile"
    description = ("Profil de l'utilisateur connecté : nom, email, rôle, téléphone. "
                   "Ex : « mon compte », « my profile », « chkoun ena ».")
    requires_auth = True

    async def run(self, ctx: ToolContext) -> ToolResult:
        r = await api_get(f"{get_settings().iam_api_url}/api/auth/profile", ctx)
        r.raise_for_status()
        u = r.json().get("data") or r.json()
        return ToolResult(ok=True, data={
            "nom": u.get("nom"), "prenom": u.get("prenom"),
            "email": u.get("email"), "role": u.get("role"),
            "telephone": u.get("telephone"),
        })


class PasswordResetTool:
    name = "password_reset"
    description = ("Déclenche l'email officiel de réinitialisation de mot de passe. "
                   "Paramètre : email. Ex : « j'ai oublié mon mot de passe ».")
    requires_auth = False           # c'est justement pour ceux qui ne peuvent plus se connecter

    async def run(self, ctx: ToolContext, email: str | None = None) -> ToolResult:
        if not email:
            return ToolResult(ok=False, error="missing_params", missing_params=["email"])
        r = await api_post(f"{get_settings().iam_api_url}/api/auth/recover-password",
                           ctx, json={"email": email})
        # L'API répond 200 même si l'email est inconnu (anti-énumération) : on
        # relaie ce comportement — Ayshaa ne confirme jamais l'existence d'un compte.
        return ToolResult(ok=r.status_code < 500, data={"email": email})
