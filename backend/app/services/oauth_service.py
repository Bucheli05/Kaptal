"""Servicio de OAuth."""

import secrets
import time
from typing import Any

from authlib.integrations.requests_client import OAuth2Session
from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token
from app.models.user import User
from app.schemas.auth import Token
from app.services.auth_service import AuthService


class OAuthService:
    """Servicio para autenticación OAuth."""

    def __init__(self, db=None):
        self.settings = get_settings()
        self.db = db
        self.auth_service = AuthService(db) if db else None

    # =========================================================================
    # GOOGLE OAUTH
    # =========================================================================

    def get_google_client(self) -> OAuth2Session:
        """Crea un cliente OAuth2 para Google."""
        return OAuth2Session(
            client_id=self.settings.GOOGLE_CLIENT_ID,
            client_secret=self.settings.GOOGLE_CLIENT_SECRET,
            scope="openid email profile",
            redirect_uri=self.settings.GOOGLE_REDIRECT_URI,
        )

    def get_google_authorization_url(self) -> tuple[str, str]:
        """Genera la URL de autorización de Google y un state."""
        client = self.get_google_client()
        state = secrets.token_urlsafe(32)
        authorization_url, _ = client.create_authorization_url(
            "https://accounts.google.com/o/oauth2/v2/auth",
            state=state,
            access_type="offline",
            prompt="consent",
        )
        return authorization_url, state

    def get_google_user_info(self, code: str) -> dict[str, Any]:
        """Intercambia el código por tokens y obtiene info del usuario."""
        client = self.get_google_client()
        token = client.fetch_token(
            "https://oauth2.googleapis.com/token",
            code=code,
        )
        resp = client.get("https://openidconnect.googleapis.com/v1/userinfo")
        resp.raise_for_status()
        return resp.json()

    # =========================================================================
    # APPLE OAUTH
    # =========================================================================

    def _generate_apple_client_secret(self) -> str:
        """Genera el client_secret JWT para Apple."""
        now = int(time.time())
        payload = {
            "iss": self.settings.APPLE_TEAM_ID,
            "iat": now,
            "exp": now + 86400 * 180,  # 6 meses
            "aud": "https://appleid.apple.com",
            "sub": self.settings.APPLE_CLIENT_ID,
        }
        headers = {"kid": self.settings.APPLE_KEY_ID}
        return jwt.encode(payload, self.settings.APPLE_PRIVATE_KEY, algorithm="ES256", headers=headers)

    def get_apple_authorization_url(self) -> tuple[str, str]:
        """Genera la URL de autorización de Apple y un state."""
        state = secrets.token_urlsafe(32)
        params = {
            "response_type": "code",
            "client_id": self.settings.APPLE_CLIENT_ID,
            "redirect_uri": self.settings.APPLE_REDIRECT_URI,
            "state": state,
            "scope": "name email",
            "response_mode": "form_post",
        }
        import urllib.parse
        query = urllib.parse.urlencode(params)
        authorization_url = f"https://appleid.apple.com/auth/authorize?{query}"
        return authorization_url, state

    def get_apple_user_info(self, code: str) -> dict[str, Any]:
        """Intercambia el código por tokens y obtiene info del usuario de Apple."""
        import requests

        client_secret = self._generate_apple_client_secret()
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.settings.APPLE_REDIRECT_URI,
            "client_id": self.settings.APPLE_CLIENT_ID,
            "client_secret": client_secret,
        }
        resp = requests.post("https://appleid.apple.com/auth/token", data=data)
        resp.raise_for_status()
        tokens = resp.json()

        # Decodificar el id_token para obtener la info del usuario
        id_token = tokens.get("id_token")
        if not id_token:
            raise ValueError("No id_token in Apple response")

        claims = jwt.get_unverified_claims(id_token)
        return {
            "sub": claims.get("sub"),
            "email": claims.get("email"),
            "email_verified": claims.get("email_verified", False),
        }

    # =========================================================================
    # COMMON
    # =========================================================================

    def create_oauth_user(self, provider: str, provider_id: str, email: str, full_name: str | None = None) -> User:
        """Crea o actualiza un usuario de OAuth."""
        if not self.auth_service:
            raise RuntimeError("AuthService not initialized")

        user = self.auth_service.get_user_by_email(email)
        if user:
            # Actualizar provider info si no existe
            if not user.provider:
                user.provider = provider
                user.provider_id = provider_id
                self.db.commit()
                self.db.refresh(user)
            return user

        # Crear nuevo usuario
        db_user = User(
            email=email,
            full_name=full_name,
            is_active=True,
            is_superuser=False,
            provider=provider,
            provider_id=provider_id,
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def create_tokens_for_user(self, user: User) -> Token:
        """Genera tokens JWT para un usuario."""
        return Token(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            token_type="bearer",
        )
