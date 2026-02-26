# Todo App — FastAPI + React + Supabase

A learning project for practising Python web development with a stack used in medical imaging software.

**Stack:** FastAPI (Python) · SQLAlchemy · React + TypeScript (Vite) · Supabase (PostgreSQL)

---

## Running the project

### First time only — Supabase setup

1. Create a free account at [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** inside your project and run this to create the todos table:

```sql
create table todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);
```

3. Go to **Project Settings → Database** and copy the **Direct connection string**.
4. Paste it into `backend/.env`, replacing `[YOUR-PASSWORD]` with your database password:

```
DATABASE_URL=postgresql://postgres.YOUR-PROJECT-REF:[YOUR-PASSWORD]@aws-1-YOUR-REGION.pooler.supabase.com:5432/postgres
```

---

### Start both servers with one command

From the project root (the `Djano Project/` folder):

```bash
npm run dev
```

That's it. Both servers start together:

| Server | URL | What it does |
|--------|-----|--------------|
| Backend (FastAPI) | http://localhost:8000 | REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Test endpoints interactively |
| Frontend (React) | http://localhost:5173 | The todo app UI |

To stop both, press `Ctrl + C` in the terminal.

---

### If you ever need to run them separately

**Backend only:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

---

## Running with Docker

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running, then from the project root:

```bash
docker compose up --build
```

That builds both images and starts both containers. On first run, the build takes a couple of minutes (it caches for subsequent runs).

| Service | URL | What it does |
|---------|-----|--------------|
| Frontend (Nginx) | http://localhost:5173 | React UI + API proxy |
| Backend (direct) | http://localhost:8000 | FastAPI REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive endpoint testing |

**Useful Docker commands:**

```bash
docker compose up --build       # Build and start
docker compose up -d            # Start in background (detached)
docker compose down             # Stop and remove containers
docker compose logs -f          # Follow live logs
docker compose logs -f backend  # Follow backend logs only
```

**Production mode** (no hot-reload, auto-restart on crash):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

In production mode, the frontend runs on port 80 and Nginx proxies API calls to the backend internally — the backend is not exposed to the outside.

---

## Project structure

```
Djano Project/
├── package.json              ← root scripts (npm run dev starts everything)
├── docker-compose.yml        ← Docker dev config (hot-reload, volume mounts)
├── docker-compose.prod.yml   ← Docker production config (no reload, restart)
├── backend/
│   ├── Dockerfile            ← multi-stage Python build (non-root user)
│   ├── .dockerignore
│   ├── main.py               ← FastAPI app, CORS, table creation on startup
│   ├── database.py           ← SQLAlchemy engine, session factory, get_db
│   ├── models.py             ← SQLAlchemy table model + Pydantic schemas
│   ├── routes/
│   │   └── todos.py          ← CRUD endpoints using SQLAlchemy queries
│   ├── requirements.txt
│   ├── .env                  ← your DATABASE_URL (never share this)
│   └── .env.example
└── frontend/
    ├── Dockerfile            ← multi-stage Node build + Nginx serve
    ├── .dockerignore
    ├── nginx.conf            ← serves React files, proxies API to backend
    └── src/
        ├── types/
        │   └── todo.ts       ← TypeScript interfaces (mirrors Pydantic models)
        ├── api/
        │   └── todos.ts      ← all API calls in one place (axios)
        ├── components/
        │   ├── TodoForm.tsx   ← create form
        │   └── TodoItem.tsx   ← single todo row (edit / toggle / delete)
        └── pages/
            └── TodosPage.tsx  ← main page, owns state, calls API
```

---

## What each file teaches you

| File | Concept |
|------|---------|
| `backend/database.py` | SQLAlchemy engine, sessions, dependency injection (`Depends`) |
| `backend/models.py` | SQLAlchemy ORM models vs Pydantic schemas (two model types) |
| `backend/routes/todos.py` | FastAPI routing, SQLAlchemy CRUD queries, `setattr` |
| `backend/main.py` | App factory, CORS from env var, `create_all`, `include_router` |
| `backend/Dockerfile` | Multi-stage builds, non-root user, health checks |
| `frontend/Dockerfile` | Build stage vs serve stage, Nginx for static files |
| `frontend/nginx.conf` | Reverse proxy, SPA fallback (`try_files`) |
| `docker-compose.yml` | Service orchestration, volumes, depends_on, env vars |
| `frontend/src/types/todo.ts` | TypeScript interfaces, optional fields |
| `frontend/src/api/todos.ts` | `async`/`await`, axios, generics |
| `frontend/src/components/TodoForm.tsx` | Controlled inputs, `useState`, form events |
| `frontend/src/components/TodoItem.tsx` | Props, lifting state up, conditional rendering |
| `frontend/src/pages/TodosPage.tsx` | `useEffect`, data fetching, optimistic state updates |
