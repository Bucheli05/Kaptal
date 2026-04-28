# AGENTS.md — Breezely

Mono-repo FastAPI backend + React frontend. Docker Compose local dev.

## Puertos

| Servicio | Puerto | Nota |
|----------|--------|------|
| Nginx (React) | `8081` | Evita conflicto Vite/Nginx local |
| FastAPI | `8001` | Evita conflicto FastAPI local |
| PostgreSQL | — | Solo red interna Docker |
| Redis | — | Solo red interna Docker |

URLs: `http://localhost:8081` (web), `http://localhost:8081/docs` (Swagger), `http://localhost:8001` (FastAPI directo)

## Docker (WSL)

Antes de cualquier comando Docker:
```bash
export PATH="$PATH:/mnt/c/Program Files/Docker/Docker/resources/bin"
```

## Comandos

**Levantar stack:**
```bash
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

**Build React + nginx:**
```bash
cd frontend && npm run build && cd .. && docker-compose restart nginx
```

**Dev frontend (hot-reload):**
```bash
cd frontend && npm run dev  # http://localhost:5173
```

**Backend calidad (orden obligatorio):**
```bash
cd backend
ruff check .
black --check .
mypy app
pytest -v --tb=short
```
Deps dev: `pip install -r requirements-dev.txt`

**Frontend:**
```bash
cd frontend && npm install && npm run build && npm run lint
```

## Arquitectura

```
backend/     FastAPI 3.11
  app/main.py   Entrypoint
  app/api/v1/   Routers (health, auth)
  app/core/     Config, DB, security, logging
  app/services/ AuthService, OAuthService
  app/models/   SQLAlchemy
  app/schemas/  Pydantic
  tests/        pytest + SQLite memoria (override get_db)
  alembic/      Migraciones

frontend/    React 19 + Vite + TS + Tailwind
  src/main.tsx  Entrypoint
  src/App.tsx   Router + guards
  src/lib/api.ts  Axios + interceptor 401→refresh
  src/stores/   Zustand (auth)
  src/components/ UI
  src/pages/    LoginPage, RegisterPage, DashboardPage

nginx/       Reverse proxy + estáticos React dist/
```

## Convenciones

- **Commits:** Español, descriptivos. Linear refs (BRE-XX).
- **Backend:** Type hints obligatorios, PEP 8. `ruff` + `black` (88) + `mypy --strict`.
- **Frontend:** TS estricto, React functional, Tailwind + `@apply` en `index.css`.

## Traps

### Tests usan SQLite, no PostgreSQL
Tests (`tests/test_auth.py`) override `get_db` con SQLite memoria (`sqlite:///./test.db`). Tablas creadas vía `Base.metadata.create_all()` en import. No DB fixtures en `conftest.py`.

### pyproject.toml desfasado
Lista `passlib[bcrypt]` pero código y `requirements.txt` usan `bcrypt` directo. Instalar deps vía `requirements-dev.txt`.

### OAuth placeholder
Botones "Continuar con Google/Apple" visuales. Backend tiene endpoints OAuth funcionales (`/api/v1/auth/google/*`, `/api/v1/auth/apple/*`), frontend no consume aún.

### Nginx sirve React estático
Monta `./frontend/dist:/usr/share/nginx/html:ro`. Sin `npm run build` primero = stale. `npm run dev` no afecta nginx.

### Backend hot-reload
Servicio `backend` monta `./backend:/app`, corre `uvicorn --reload`. Cambios Python reflejan sin rebuild, no `requirements.txt`.

### Variables de entorno
Backend carga `.env` vía `pydantic-settings`. En Docker, vars de `docker-compose.yml` sobreescriben `.env`.

## CI

`.github/workflows/ci.yml` — 3 jobs paralelos:
1. **backend:** lint → format → typecheck → test
2. **frontend:** `npm install` → `npm run build` → `npm run lint`
3. **docker:** `docker-compose config` + `docker-compose build backend nginx`

## Usuario de prueba

Email: `test@breezely.com`
Password: `testpass123`
