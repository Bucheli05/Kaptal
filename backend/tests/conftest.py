"""Configuración de pytest."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """Fixture del cliente de test de FastAPI."""
    return TestClient(app)
