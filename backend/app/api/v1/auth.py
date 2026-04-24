"""Router de autenticación funcional con OAuth."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.auth import UserCreate, UserLogin, Token, RefreshToken
from app.services.auth_service import AuthService
from app.services.oauth_service import OAuthService

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)) -> dict[str, str]:
    """Registro de nuevo usuario."""
    auth_service = AuthService(db)
    
    # Verificar si el email ya existe
    existing_user = auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Crear usuario
    user = auth_service.create_user(user_data)
    
    # Generar tokens
    tokens = auth_service.create_tokens(user.id)
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Login de usuario con email y contraseña."""
    auth_service = AuthService(db)
    
    user = auth_service.authenticate(
        UserLogin(email=form_data.username, password=form_data.password)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    tokens = auth_service.create_tokens(user.id)
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh(refresh_data: RefreshToken, db: Session = Depends(get_db)) -> dict[str, str]:
    """Refresca el access token usando un refresh token."""
    from app.core.security import decode_token
    
    payload = decode_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = auth_service.create_tokens(user.id)
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
    }


# ============================================================================
# GOOGLE OAUTH
# ============================================================================

@router.get("/google/login")
async def google_login() -> dict[str, str]:
    """Redirige al usuario a Google para autenticación.
    
    En producción, esto debería retornar la URL para que el frontend redirija.
    """
    oauth_service = OAuthService()
    auth_url, state = oauth_service.get_google_authorization_url()
    return {"authorization_url": auth_url, "state": state}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)) -> Token:
    """Callback de Google OAuth."""
    oauth_service = OAuthService(db)
    
    try:
        user_info = oauth_service.get_google_user_info(code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Google: {str(e)}",
        )
    
    email = user_info.get("email")
    google_id = user_info.get("sub")
    name = user_info.get("name")
    
    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user info from Google",
        )
    
    user = oauth_service.create_oauth_user(
        provider="google",
        provider_id=google_id,
        email=email,
        full_name=name,
    )
    
    return oauth_service.create_tokens_for_user(user)


# ============================================================================
# APPLE OAUTH
# ============================================================================

@router.get("/apple/login")
async def apple_login() -> dict[str, str]:
    """Redirige al usuario a Apple para autenticación."""
    oauth_service = OAuthService()
    auth_url, state = oauth_service.get_apple_authorization_url()
    return {"authorization_url": auth_url, "state": state}


@router.post("/apple/callback")
async def apple_callback(code: str, db: Session = Depends(get_db)) -> Token:
    """Callback de Apple OAuth (form_post)."""
    oauth_service = OAuthService(db)
    
    try:
        user_info = oauth_service.get_apple_user_info(code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Apple: {str(e)}",
        )
    
    email = user_info.get("email")
    apple_id = user_info.get("sub")
    
    if not email or not apple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user info from Apple",
        )
    
    user = oauth_service.create_oauth_user(
        provider="apple",
        provider_id=apple_id,
        email=email,
    )
    
    return oauth_service.create_tokens_for_user(user)
