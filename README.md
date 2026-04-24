# Breezely

Aplicación de seguimiento de portafolio de inversión conectada a Interactive Brokers (IBKR).

## Estructura del Proyecto

```
Breezely/
├── backend/          # FastAPI + PostgreSQL + Redis
│   ├── app/          # Código fuente
│   ├── alembic/      # Migraciones
│   └── tests/        # Tests
├── frontend/         # Flutter
│   └── lib/          # Código fuente
├── nginx/            # Configuración reverse proxy
└── docker-compose.yml
```

## Quick Start

```bash
# 1. Levantar servicios
docker-compose up -d

# 2. Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# 3. Abrir app Flutter
flutter run
```

## Stack Tecnológico

- **Backend:** FastAPI, PostgreSQL, Redis, Celery, Alembic
- **Frontend:** Flutter
- **Infra:** Docker, Nginx, Let's Encrypt

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md)
