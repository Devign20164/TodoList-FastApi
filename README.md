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
├── .github/
│   └── workflows/
│       └── ci.yml            ← GitHub Actions CI (runs on every push/PR)
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

## CI/CD — Automated testing and deployment

Every push to `main` triggers a GitHub Actions pipeline that checks your code automatically.

### What happens on `git push`

1. **GitHub Actions** (CI) runs two jobs in parallel:
   - **Backend**: installs Python deps, verifies the app starts, hits `/health`
   - **Frontend**: installs Node deps, type-checks, lints, builds
2. If both pass, **Railway** auto-deploys the backend and **Vercel** auto-deploys the frontend

### GitHub Actions secret (one-time setup)

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
- Name: `DATABASE_URL`
- Value: your Supabase connection string (same one from `backend/.env`)

This lets the CI backend job connect to your database during testing.

### Deploy backend to Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **GitHub Repository** and select your repo
3. In the service settings:
   - Set **Root Directory** to `backend`
   - Railway will detect the `Dockerfile` automatically
4. Go to **Variables** and add:
   - `DATABASE_URL` = your Supabase connection string
   - `CORS_ORIGINS` = your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
5. Railway gives you a public URL like `https://your-app.up.railway.app`

### Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Configure the project:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Go to **Settings → Environment Variables** and add:
   - `VITE_API_URL` = your Railway backend URL (e.g. `https://your-app.up.railway.app`)
4. Vercel gives you a public URL like `https://your-app.vercel.app`

### After both are deployed

Update Railway's `CORS_ORIGINS` variable with your actual Vercel URL so the backend accepts requests from the frontend. Then every `git push` to `main` auto-deploys both services.

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
| `.github/workflows/ci.yml` | GitHub Actions, CI pipelines, parallel jobs, secrets |
| `frontend/src/types/todo.ts` | TypeScript interfaces, optional fields |
| `frontend/src/api/todos.ts` | `async`/`await`, axios, generics |
| `frontend/src/components/TodoForm.tsx` | Controlled inputs, `useState`, form events |
| `frontend/src/components/TodoItem.tsx` | Props, lifting state up, conditional rendering |
| `frontend/src/pages/TodosPage.tsx` | `useEffect`, data fetching, optimistic state updates |
