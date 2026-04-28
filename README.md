# Breezely

> Investment Portfolio Tracker with Interactive Brokers Integration

Breezely is a modern investment portfolio tracker that seamlessly syncs with Interactive Brokers (IBKR) to give you real-time insights into your investment performance. Built as a full-stack application with a FastAPI backend and React frontend, it provides a clean, intuitive interface for managing and visualizing your trading portfolio.

## Features

- **Authentication** — Email/password login with OAuth support (Google, Apple)
- **Portfolio Sync** — Automatic synchronization via IBKR Flex Query API
- **Performance Charts** — Interactive charts showing portfolio performance over time
- **Allocation Views** — Visual pie charts for asset allocation analysis
- **Dark Mode** — Full dark mode support for comfortable viewing
- **Broker Management** — Connect and manage broker connections

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI (Python 3.11), PostgreSQL, Redis |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Chart.js |
| Infrastructure | Docker Compose, Nginx reverse proxy |
| Quality | ruff, black, mypy, ESLint, GitHub Actions CI |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) 18+ (for frontend development)
- [Python](https://www.python.org/) 3.11+ (for backend development)

### Running with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/breezely.git
   cd breezely
   ```

2. **Configure environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values
   ```

3. **Start the stack:**
   ```bash
   docker-compose up -d
   docker-compose exec backend alembic upgrade head
   ```

4. **Access the application:**
   - Web app: http://localhost:8081
   - API docs (Swagger): http://localhost:8081/docs
   - FastAPI direct: http://localhost:8001

### Development

**Backend:**
```bash
cd backend
pip install -r requirements-dev.txt
ruff check .
black --check .
mypy app
pytest -v --tb=short
```

**Frontend (hot-reload):**
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**Frontend (production build):**
```bash
cd frontend && npm run build && cd .. && docker-compose restart nginx
```

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/v1/       # API routers (auth, portfolio)
│   │   ├── core/         # Config, DB, security, logging
│   │   ├── services/     # Business logic (Auth, IBKR)
│   │   ├── models/       # SQLAlchemy models
│   │   └── schemas/      # Pydantic schemas
│   ├── tests/            # Pytest tests (SQLite in-memory)
│   └── alembic/          # Database migrations
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── stores/       # Zustand state stores
│   │   └── lib/          # API client, utilities
│   └── tailwind.config.js
├── nginx/                # Nginx configuration
└── docker-compose.yml    # Docker services
```

## IBKR Integration

Breezely syncs portfolio data using Interactive Brokers Flex Query API. To set up:

1. Create a Flex Query in your IBKR Account Management
2. Include the following fields: `position`, `assetCategory`, `currency`, `marketValue`, `closePrice`
3. Copy the Query ID and Token into your `.env` file

## License

This project is licensed under a **Personal Use License**. See the [LICENSE](LICENSE) file for details.

Personal use is permitted. Commercial use, redistribution, or sale is strictly prohibited without explicit written permission from the author.
