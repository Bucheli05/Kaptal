# AGENTS.md — Breezely

Mono-repo FastAPI backend + Flutter frontend. Docker Compose para desarrollo local.

## Puertos y acceso

| Servicio | Puerto host | Nota |
|----------|-------------|------|
| Nginx (Flutter web) | `8081` | Evita conflicto con Vite/Nginx locales del usuario |
| FastAPI directo | `8001` | Evita conflicto con FastAPI local del usuario |
| PostgreSQL | — | Solo red interna Docker (evita conflicto con Postgres local) |
| Redis | — | Solo red interna Docker (evita conflicto con Redis local) |

URLs activas tras `docker-compose up`:
- Flutter web: `http://localhost:8081`
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

### Build Flutter + recargar nginx
```bash
export PATH="$PATH:/home/jose9/flutter/bin"
cd frontend && flutter build web --release
cd .. && docker-compose restart nginx
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
flutter pub get
flutter analyze
flutter test
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

frontend/         Flutter (SDK en /home/jose9/flutter/bin)
  lib/main.dart   Entrypoint
  lib/core/       Routing, theme, widgets
  lib/features/   Auth, Dashboard, Profile

nginx/            Reverse proxy + archivos estáticos Flutter build/web/
```

## Convenciones del repo

- **Commits:** En español, descriptivos. Se usan referencias a Linear (BRE-XX) cuando aplica.
- **Backend:** Type hints obligatorios, PEP 8. `ruff` + `black` (line-length 88) + `mypy --strict`.
- **Frontend:** Dart con `effective_dart`/`flutter_lints`.

## Traps y gotchas

### `.gitignore` peligroso
`lib/` está en `.gitignore` como `backend/lib/` (virtualenvs), pero **no debe ignorar `frontend/lib/`**. Ya fue corregido; si se regenera `.gitignore`, verificar que `frontend/lib/` no quede atrapado.

### Tests usan SQLite, no PostgreSQL
A pesar de que CI levanta PostgreSQL, los tests (`tests/test_auth.py`) hacen override de `get_db` con SQLite en memoria (`sqlite:///./test.db`). Las tablas se crean vía `Base.metadata.create_all()` en import time. No hay fixtures de DB en `conftest.py` más allá del `TestClient`.

### pyproject.toml desfasado
`pyproject.toml` lista `passlib[bcrypt]` pero el código y `requirements.txt` usan `bcrypt` directo (más compatible con Python 3.12). Para instalar deps, usar `requirements-dev.txt`, no `pyproject.toml`.

### Firebase desactivado
`firebase_core` y `firebase_messaging` están comentados en `pubspec.yaml` porque rompen el build de Flutter web. Se reactivarán en Epic 5 (notificaciones push móvil).

### OAuth visual placeholder
Los botones "Iniciar con Google/Apple" en login/register son visuales. El backend **sí** tiene endpoints OAuth funcionales (`/api/v1/auth/google/*`, `/api/v1/auth/apple/*`), pero el frontend no los consume aún.

### Assets faltantes en pubspec
`pubspec.yaml` declara `assets/images/` y `assets/icons/` pero los directorios no existen. `flutter build web` lanza warnings. Crear los directorios vacíos si se agregan assets, o eliminar las líneas si no se usan.

### Nginx sirve Flutter estático
El contenedor `nginx` monta `./frontend/build/web:/usr/share/nginx/html:ro`. Si no se hace `flutter build web --release` primero, la app web no se actualiza. `flutter run` no afecta lo servido por nginx.

### Backend hot-reload en Docker
El servicio `backend` monta `./backend:/app` y corre `uvicorn --reload`. Los cambios en Python se reflejan sin rebuild, pero **no** para cambios en `requirements.txt`.

### Variables de entorno
El backend carga `.env` vía `pydantic-settings`. En Docker, las variables se inyectan desde `docker-compose.yml` y sobreescriben `.env`.

## CI pipeline

`.github/workflows/ci.yml` corre en tres jobs paralelos:
1. **backend:** lint (ruff) → format (black --check) → typecheck (mypy app) → test (pytest)
2. **frontend:** `flutter pub get` → `flutter analyze` → `flutter test`
3. **docker:** `docker-compose config` + `docker-compose build backend nginx`

## Usuario de prueba

Email: `test@breezely.com`
Password: `testpass123`

Creado vía registro o directo en tests.
