# AGENTS.md — Breezely

Mono-repo FastAPI backend + React frontend. Docker Compose para desarrollo local.

## Puertos y acceso

| Servicio | Puerto host | Nota |
|----------|-------------|------|
| Nginx (React web) | `8081` | Evita conflicto con Vite/Nginx locales del usuario |
| FastAPI directo | `8001` | Evita conflicto con FastAPI local del usuario |
| PostgreSQL | — | Solo red interna Docker (evita conflicto con Postgres local) |
| Redis | — | Solo red interna Docker (evita conflicto con Redis local) |

URLs activas tras `docker-compose up`:
- React web: `http://localhost:8081`
- Swagger: `http://localhost:8081/docs`
- FastAPI directo: `http://localhost:8001`

## Docker en este entorno (WSL)

Docker funciona vía WSL. Antes de cualquier comando Docker:

```bash
export PATH="$PATH:/mnt/c/Program Files/Docker/Docker/resources/bin"
```

## Comandos esenciales

### Levantar stack completo
```bash
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

### Build React + recargar nginx
```bash
cd frontend && npm run build
cd .. && docker-compose restart nginx
```

### Desarrollo frontend (hot-reload)
```bash
cd frontend && npm run dev
# Abre http://localhost:5173
```

### Backend — calidad de código (orden obligatorio)
```bash
cd backend
ruff check .
black --check .
mypy app
pytest -v --tb=short
```

Deps de desarrollo: `pip install -r requirements-dev.txt` (incluye `requirements.txt`).

### Frontend
```bash
cd frontend
npm install
npm run build
npm run lint
```

## Arquitectura

```
backend/          FastAPI, Python 3.11
  app/main.py     Entrypoint
  app/api/v1/     Routers (health, auth)
  app/core/       Config, DB, security, logging
  app/services/   AuthService, OAuthService
  app/models/     SQLAlchemy models
  app/schemas/    Pydantic schemas
  tests/          pytest + SQLite en memoria (override de get_db)
  alembic/        Migraciones

frontend/         React 19 + Vite + TypeScript + Tailwind CSS
  src/main.tsx    Entrypoint
  src/App.tsx     Router + guards
  src/lib/api.ts  Axios con interceptor 401 → refresh
  src/stores/     Zustand stores (auth)
  src/components/ Reusable UI
  src/pages/      LoginPage, RegisterPage, DashboardPage

nginx/            Reverse proxy + archivos estáticos React dist/
```

## Convenciones del repo

- **Commits:** En español, descriptivos. Se usan referencias a Linear (BRE-XX) cuando aplica.
- **Backend:** Type hints obligatorios, PEP 8. `ruff` + `black` (line-length 88) + `mypy --strict`.
- **Frontend:** TypeScript estricto, React functional components, Tailwind con `@apply` en `index.css`.

## Traps y gotchas

### Tests usan SQLite, no PostgreSQL
A pesar de que CI levanta PostgreSQL, los tests (`tests/test_auth.py`) hacen override de `get_db` con SQLite en memoria (`sqlite:///./test.db`). Las tablas se crean vía `Base.metadata.create_all()` en import time. No hay fixtures de DB en `conftest.py` más allá del `TestClient`.

### pyproject.toml desfasado
`pyproject.toml` lista `passlib[bcrypt]` pero el código y `requirements.txt` usan `bcrypt` directo (más compatible con Python 3.12). Para instalar deps, usar `requirements-dev.txt`, no `pyproject.toml`.

### OAuth visual placeholder
Los botones "Continuar con Google/Apple" en login/register son visuales. El backend **sí** tiene endpoints OAuth funcionales (`/api/v1/auth/google/*`, `/api/v1/auth/apple/*`), pero el frontend no los consume aún.

### Nginx sirve React estático
El contenedor `nginx` monta `./frontend/dist:/usr/share/nginx/html:ro`. Si no se hace `npm run build` primero, la app web no se actualiza. `npm run dev` no afecta lo servido por nginx.

### Backend hot-reload en Docker
El servicio `backend` monta `./backend:/app` y corre `uvicorn --reload`. Los cambios en Python se reflejan sin rebuild, pero **no** para cambios en `requirements.txt`.

### Variables de entorno
El backend carga `.env` vía `pydantic-settings`. En Docker, las variables se inyectan desde `docker-compose.yml` y sobreescriben `.env`.

## CI pipeline

`.github/workflows/ci.yml` corre en tres jobs paralelos:
1. **backend:** lint (ruff) → format (black --check) → typecheck (mypy app) → test (pytest)
2. **frontend:** `npm install` → `npm run build` → `npm run lint`
3. **docker:** `docker-compose config` + `docker-compose build backend nginx`

## Usuario de prueba

Email: `test@breezely.com`
Password: `testpass123`

Creado vía registro o directo en tests.
