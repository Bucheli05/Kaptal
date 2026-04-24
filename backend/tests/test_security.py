"""Tests para seguridad."""

import pytest
from app.core.security import verify_password, get_password_hash, create_access_token


def test_password_hashing() -> None:
    """Test de hash y verificación de contraseña."""
    password = "testpassword123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token() -> None:
    """Test de creación de access token."""
    data = {"sub": "test@example.com"}
    token = create_access_token(data)
    assert isinstance(token, str)
    assert len(token) > 0
