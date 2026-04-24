# FastAPI Backend

## Development

```bash
# Instalar dependencias
pip install -r requirements.txt

# Variables de entorno
export DATABASE_URL="postgresql://breezely:breezely@localhost:5432/breezely"
export REDIS_URL="redis://localhost:6379/0"

# Ejecutar
uvicorn app.main:app --reload --port 8000

# Tests
pytest

# Lint
ruff check .
black --check .
```

## Estructura

```
app/
├── __init__.py
├── main.py              # Entry point
├── core/                # Config, seguridad, logging
│   ├── config.py
│   ├── security.py
│   └── logging.py
├── api/                 # Routers
│   ├── __init__.py
│   ├── v1/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── health.py
│   │   └── users.py
│   └── deps.py
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   └── user.py
└── services/            # Business logic
    ├── __init__.py
    └── user_service.py
```
