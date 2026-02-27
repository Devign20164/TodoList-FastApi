# Project Guide — From Zero to Production

A complete walkthrough of how this Todo application was built, from creating the frontend and backend to deploying with Docker and CI/CD. Written as a learning reference for a web developer learning Python and DevOps.

---

## Table of Contents

1. [Phase 1 — Frontend (React + TypeScript)](#phase-1--frontend-react--typescript)
2. [Phase 2 — Backend (FastAPI + Python)](#phase-2--backend-fastapi--python)
3. [Phase 3 — Database (Supabase + SQLAlchemy)](#phase-3--database-supabase--sqlalchemy)
4. [Phase 4 — Connecting Frontend to Backend](#phase-4--connecting-frontend-to-backend)
5. [Phase 5 — Running Both with Concurrently](#phase-5--running-both-with-concurrently)
6. [Phase 6 — Dockerizing the Application](#phase-6--dockerizing-the-application)
7. [Phase 7 — CI/CD Pipeline](#phase-7--cicd-pipeline)
8. [Phase 8 — Branching Strategy](#phase-8--branching-strategy)
9. [Concurrently vs Docker — What's the Difference?](#concurrently-vs-docker--whats-the-difference)
10. [Common Errors We Encountered](#common-errors-we-encountered)
11. [Glossary](#glossary)

---

## Phase 1 — Frontend (React + TypeScript)

### What we built

A React app using Vite and TypeScript that displays, creates, edits, and deletes todos.

### Key files

| File | Purpose |
|------|---------|
| `frontend/src/types/todo.ts` | TypeScript interfaces that mirror the backend's data shapes |
| `frontend/src/api/todos.ts` | All HTTP calls to the backend using Axios |
| `frontend/src/components/TodoForm.tsx` | Form component for creating new todos |
| `frontend/src/components/TodoItem.tsx` | Displays a single todo with edit/delete/toggle actions |
| `frontend/src/pages/TodosPage.tsx` | Main page that owns the state and calls the API |

### Concepts learned

- **TypeScript interfaces** — define the shape of data (like a contract between frontend and backend)
- **useState / useEffect** — React hooks for managing state and side effects (API calls)
- **Controlled inputs** — form inputs whose values are managed by React state
- **Lifting state up** — keeping state in a parent component and passing callbacks to children
- **Axios** — HTTP client for making API requests (cleaner than `fetch`)

### How data flows

```
User clicks "Add Todo"
  → TodoForm calls createTodo() from api/todos.ts
    → Axios sends POST request to http://localhost:8000/todos/
      → Backend receives it, saves to database, returns the new todo
    → TodosPage adds the new todo to its state
  → React re-renders the list with the new todo
```

---

## Phase 2 — Backend (FastAPI + Python)

### What we built

A REST API with 5 endpoints for CRUD operations on todos.

### Key files

| File | Purpose |
|------|---------|
| `backend/main.py` | App entry point — creates FastAPI instance, configures CORS, registers routes |
| `backend/database.py` | SQLAlchemy connection — engine, session factory, `get_db` dependency |
| `backend/models.py` | Two types of models: SQLAlchemy (database table) and Pydantic (API validation) |
| `backend/routes/todos.py` | All CRUD endpoints using SQLAlchemy queries |
| `backend/requirements.txt` | Python dependencies with pinned versions |

### The 5 API endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `GET` | `/todos/` | List all todos (newest first) |
| `GET` | `/todos/{id}` | Get one todo by ID |
| `POST` | `/todos/` | Create a new todo |
| `PATCH` | `/todos/{id}` | Update specific fields of a todo |
| `DELETE` | `/todos/{id}` | Delete a todo |

### Concepts learned

- **FastAPI** — Python web framework that auto-generates API docs at `/docs`
- **Pydantic models** — validate incoming JSON and serialize outgoing responses (like TypeScript interfaces but for Python)
- **SQLAlchemy ORM** — maps Python classes to database tables, lets you write queries as Python code instead of raw SQL
- **Dependency Injection** — `Depends(get_db)` automatically creates and cleans up database sessions per request
- **CORS** — Cross-Origin Resource Sharing. The backend must explicitly allow the frontend (on a different port) to make requests
- **UUID** — universally unique identifiers used as primary keys instead of auto-incrementing integers

### Why two types of models?

```
SQLAlchemy model (Todo class)     →  maps to the DATABASE TABLE
Pydantic model (TodoResponse)     →  defines the API's JSON shape

They look similar but serve different layers:
  - SQLAlchemy talks to PostgreSQL
  - Pydantic talks to the frontend via HTTP
```

---

## Phase 3 — Database (Supabase + SQLAlchemy)

### What we used

Supabase provides a hosted PostgreSQL database. We connect to it directly using SQLAlchemy (not the Supabase client library).

### Why SQLAlchemy instead of supabase-py?

We initially tried `supabase-py` but the Supabase Data API was disabled. Instead of re-enabling it, we switched to a direct PostgreSQL connection using SQLAlchemy because:

1. It's the industry standard for Python database access
2. It works with any PostgreSQL database (not locked to Supabase)
3. It teaches ORM concepts used in Django, Flask, and every Python web framework

### Connection flow

```
backend/.env has DATABASE_URL
  → database.py reads it with os.environ["DATABASE_URL"]
    → SQLAlchemy creates an engine (connection pool)
      → get_db() yields a session per request
        → routes use the session to query/insert/update/delete
```

---

## Phase 4 — Connecting Frontend to Backend

### The CORS problem

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000`. Browsers block requests between different origins (ports count as different origins) unless the backend explicitly allows it.

### How we solved it

In `backend/main.py`:

```python
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # which frontends can talk to us
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Why different ports?

- **React dev server (5173)** — serves your React code with hot module replacement
- **FastAPI (8000)** — serves API data as JSON

They're separate processes doing completely different jobs. In production, Nginx or Vercel handles serving the frontend, and Railway runs the backend — each on their own domain.

---

## Phase 5 — Running Both with Concurrently

### The problem

During development, you need two terminals open:

```bash
# Terminal 1
cd backend && uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev
```

### The solution

We added `concurrently` to run both with one command:

```json
{
  "scripts": {
    "dev": "concurrently --names \"backend,frontend\" --prefix-colors \"blue,green\" \"npm run backend\" \"npm run frontend\"",
    "backend": "cd backend && venv/bin/uvicorn main:app --reload",
    "frontend": "cd frontend && npm run dev"
  }
}
```

Now `npm run dev` starts both servers. Press `Ctrl+C` to stop both.

### What concurrently does

- Runs multiple commands in parallel in ONE terminal
- Color-codes the output (blue for backend, green for frontend)
- Stops everything when you press `Ctrl+C`

### What concurrently does NOT do

- Does not package your app
- Does not isolate environments
- Does not help with deployment
- Only useful during local development

---

## Phase 6 — Dockerizing the Application

### What is Docker?

Docker packages your application and ALL its dependencies into a single container. Think of it as a lightweight virtual machine that runs the same way on every computer.

### Why Docker?

| Without Docker | With Docker |
|---|---|
| "It works on my machine" | Works the same everywhere |
| Install Python 3.11, Node 22, Nginx manually | `docker compose up` — done |
| Different OS versions cause bugs | Same Linux environment always |
| Onboarding a new developer takes hours | Clone repo, `docker compose up`, done |

### Architecture

```
docker-compose.yml orchestrates two services:

┌─────────────────────────────────┐
│         Docker Compose          │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │  backend   │  │  frontend  │  │
│  │  FastAPI   │  │  Nginx     │  │
│  │  Port 8000 │  │  Port 80   │  │
│  │  Python    │  │  Static    │  │
│  │  3.11-slim │  │  files     │  │
│  └───────────┘  └────────────┘  │
│       ↕                         │
│  Supabase (external DB)         │
└─────────────────────────────────┘
```

### Backend Dockerfile explained

```dockerfile
# Stage 1: Install dependencies in a temporary build image
FROM python:3.11-slim AS builder
COPY requirements.txt .
RUN python -m venv /app/venv && \
    /app/venv/bin/pip install -r requirements.txt

# Stage 2: Copy only what's needed into the final image
FROM python:3.11-slim
RUN adduser --system appuser          # non-root user for security
COPY --from=builder /app/venv /app/venv  # pre-built dependencies
COPY . .                              # application code
USER appuser                          # don't run as root
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Multi-stage build** — Stage 1 has build tools (compilers etc). Stage 2 only has the runtime. This makes the final image smaller and more secure.

### Frontend Dockerfile explained

```dockerfile
# Stage 1: Build React app with Node.js
FROM node:22-alpine AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build     # outputs static files to /app/dist

# Stage 2: Serve with Nginx (tiny, fast web server)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
```

**Why Nginx instead of Node?** Node.js is 900MB+. Nginx Alpine is ~25MB. For serving static HTML/CSS/JS files, Nginx is faster, lighter, and more secure.

### Docker Compose explained

```yaml
services:
  backend:
    build: ./backend            # build from backend/Dockerfile
    ports: ["8000:8000"]        # host:container port mapping
    env_file: ./backend/.env    # load DATABASE_URL
    volumes: [./backend:/app]   # live code sync (dev only)
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend           # build from frontend/Dockerfile
    ports: ["5173:80"]          # map localhost:5173 to container's port 80
    depends_on:
      backend:
        condition: service_healthy  # wait for backend to be ready
```

### Key Docker commands

```bash
docker compose up --build       # Build images and start containers
docker compose up -d            # Start in background (detached)
docker compose down             # Stop and remove containers
docker compose logs -f          # Follow live logs
docker compose logs -f backend  # Follow only backend logs
```

---

## Phase 7 — CI/CD Pipeline

### What is CI/CD?

- **CI (Continuous Integration)** — automatically test and build your code on every push
- **CD (Continuous Deployment)** — automatically deploy to production after CI passes

### Our setup

| Tool | Role |
|------|------|
| GitHub Actions | CI — runs tests and builds on every push/PR |
| Railway | CD — auto-deploys backend after CI passes |
| Vercel | CD — auto-deploys frontend on every push |

### How the CI pipeline works

```yaml
# .github/workflows/ci.yml triggers on every push and PR

jobs:
  backend:                        # runs in parallel with frontend
    - Checkout code
    - Install Python 3.11
    - pip install -r requirements.txt
    - Start uvicorn, hit /health endpoint
    - If health check passes → backend CI passes

  frontend:                       # runs in parallel with backend
    - Checkout code
    - Install Node 22
    - npm ci
    - npx tsc --noEmit            # type checking
    - npm run lint                # code style
    - npm run build               # production build
    - If all pass → frontend CI passes
```

### How the CD pipeline works

```
git push to master
       │
       ▼
GitHub Actions CI
├── backend ✅    (16s)
└── frontend ✅   (17s)
       │
       ▼ (only if both pass)
├── Railway sees ✅ → deploys backend
└── Vercel sees ✅ → deploys frontend
       │
       ▼ (if CI fails)
├── Railway sees ❌ → does NOT deploy
└── Developer gets notified → fixes code → pushes again
```

### What CI catches

| Error type | Caught by | Fails CI? |
|---|---|---|
| TypeScript type error | `tsc --noEmit` | Yes |
| ESLint error | `npm run lint` | Yes |
| Build error / missing import | `npm run build` | Yes |
| Python import error | `uvicorn` startup | Yes |
| Backend crash on startup | Health check | Yes |
| Logic bug (wrong calculation) | Not caught | No — needs unit tests |
| CSS/UI issues | Not caught | No — needs visual testing |

### GitHub Secrets

The CI pipeline needs your database connection string to test the backend. This is stored as a **repository secret** in GitHub (Settings → Secrets → Actions), never in code.

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Phase 8 — Branching Strategy

### The branch hierarchy

```
master                    ← production (live users)
  ↑ PR (manual merge, reviewed)
development               ← staging (team tests here)
  ↑ PR (CI must pass)
feature/add-login          ← your working branch
```

### The rules

| Rule | Why |
|------|-----|
| Never push directly to `master` | Protects production |
| Never push directly to `development` | Keeps staging stable |
| All work on feature branches | Isolates your changes |
| Merge to `development` via PR | CI checks code first |
| Merge to `master` via PR + review | Human approves before production |

### Daily workflow

```bash
# 1. Start from development
git checkout development
git pull origin development
git checkout -b feature/add-login

# 2. Write code, commit, push
git add .
git commit -m "add login page"
git push -u origin feature/add-login

# 3. Create PR on GitHub: feature/add-login → development
#    CI runs automatically. If it passes, merge.

# 4. When development is tested and ready:
#    Create PR: development → master
#    Teammate reviews. Merge manually.
#    Railway + Vercel auto-deploy.
```

### Merge conflicts

When two branches change the same lines in the same file, Git can't decide which version to keep. You resolve it manually — this is normal and expected.

```
<<<<<<< feature/add-login      ← your version
    <h1>Sign In</h1>
=======                         ← separator
    <h1>Welcome</h1>
>>>>>>> development             ← their version
```

Pick the version you want (or combine them), remove the markers, commit.

---

## Concurrently vs Docker — What's the Difference?

This is a common point of confusion. They solve different problems.

### Concurrently

```bash
npm run dev    # uses concurrently under the hood
```

| Aspect | Concurrently |
|--------|-------------|
| **What it does** | Runs multiple terminal commands at the same time |
| **Use case** | Local development only |
| **Dependencies** | You must have Python, Node, etc. installed on YOUR machine |
| **Environment** | Uses your Mac's OS, your Python version, your Node version |
| **Networking** | Both servers run directly on your machine (localhost) |
| **Deployment** | Cannot deploy with this — it's a dev tool |
| **Analogy** | Opening two terminal tabs at once |

### Docker

```bash
docker compose up --build
```

| Aspect | Docker |
|--------|--------|
| **What it does** | Packages each service in its own isolated container |
| **Use case** | Development, testing, production, deployment |
| **Dependencies** | Only Docker needs to be installed — everything else is inside containers |
| **Environment** | Each container has its own Linux, Python, Node — independent of your Mac |
| **Networking** | Containers communicate over a virtual Docker network |
| **Deployment** | Can deploy the exact same container to any server |
| **Analogy** | Each service gets its own mini-computer |

### When to use which

| Scenario | Use |
|----------|-----|
| Quick local development on your own machine | `npm run dev` (concurrently) |
| Sharing the project with a teammate who has a different OS | Docker |
| Deploying to production (Railway, AWS, etc.) | Docker |
| Making sure "it works on my machine" works everywhere | Docker |
| Running a quick test or debug session | Either works |

### Key difference in one sentence

**Concurrently** runs commands on YOUR machine. **Docker** runs commands inside isolated containers that are identical everywhere.

---

## Common Errors We Encountered

### 1. CORS error in browser

```
Access to XMLHttpRequest has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**What it means:** The browser blocks requests between different origins (ports). The backend needs to explicitly allow the frontend's origin.

**Fix:** Add the frontend URL to `CORS_ORIGINS` in the backend's environment variables. Also check if the real error is a backend crash — CORS errors often mask 500 Internal Server Errors.

### 2. UUID type mismatch

```
Input should be a valid string, input: UUID('...')
```

**What it means:** PostgreSQL returns UUID objects, but the Pydantic model expected a string.

**Fix:** Change the Pydantic model's `id` field from `str` to `uuid.UUID`.

### 3. CI health check timing out

```
curl: Failed to connect to localhost port 8000
INFO: Application startup complete.
```

**What it means:** The `curl` command ran before the server finished starting. The server connects to a remote database (Supabase in Australia), which takes a few seconds.

**Fix:** Replace the fixed `sleep 3` with a retry loop that tries up to 10 times with 2-second intervals.

### 4. Railway running Node instead of Python

```
Error: Cannot find module '/app/index.js'
```

**What it means:** Railway found the root `package.json` and tried to run the project as a Node.js app.

**Fix:** Set the Root Directory to `backend` in Railway's Settings → Source.

### 5. Secrets as environment vs repository secrets

**What it means:** GitHub has two types of secrets — environment secrets (scoped to a named environment) and repository secrets (available to all workflows). If the CI workflow doesn't reference an environment, environment secrets are invisible.

**Fix:** Use repository secrets (Settings → Secrets → Actions → New repository secret).

### 6. Trailing slash in CORS_ORIGINS

```
CORS_ORIGINS = "https://my-app.vercel.app/"   ← trailing slash
Browser sends: Origin: https://my-app.vercel.app   ← no slash
```

**What it means:** The origins don't match because of the trailing `/`.

**Fix:** Remove the trailing slash from the CORS_ORIGINS value.

---

## Glossary

| Term | Definition |
|------|-----------|
| **API** | Application Programming Interface — a set of endpoints the frontend calls to get/send data |
| **REST** | A style of API design using HTTP methods (GET, POST, PATCH, DELETE) and resource URLs |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations |
| **ORM** | Object-Relational Mapping — write database queries as Python code instead of raw SQL |
| **CORS** | Cross-Origin Resource Sharing — browser security that blocks requests between different domains/ports |
| **UUID** | Universally Unique Identifier — a 128-bit ID like `550e8400-e29b-41d4-a716-446655440000` |
| **Pydantic** | Python library that validates data shapes (like TypeScript interfaces for Python) |
| **SQLAlchemy** | Python ORM that maps classes to database tables |
| **Dependency Injection** | A pattern where the framework provides (injects) objects your function needs |
| **Vite** | Fast build tool for React/Vue/Svelte — replaces Create React App |
| **Uvicorn** | ASGI server that runs FastAPI — like `npm run dev` but for Python |
| **Nginx** | Web server used to serve static files and proxy API requests |
| **Docker Image** | A snapshot of your application and all its dependencies — like a blueprint |
| **Docker Container** | A running instance of an image — like a running app from the blueprint |
| **Docker Compose** | A tool to run multiple containers together with shared networking |
| **Multi-stage build** | A Dockerfile technique that uses one stage to build and another to run, keeping the final image small |
| **CI** | Continuous Integration — automatically test code on every push |
| **CD** | Continuous Deployment — automatically deploy after tests pass |
| **GitHub Actions** | GitHub's built-in CI/CD service that runs workflows defined in YAML files |
| **Railway** | Cloud platform for deploying backend services (like Heroku) |
| **Vercel** | Cloud platform optimized for deploying frontend apps |
| **PR (Pull Request)** | A request to merge code from one branch into another, with review and CI checks |
| **Merge conflict** | When two branches change the same lines — Git can't auto-merge and asks you to decide |
| **Repository secret** | A secret value stored in GitHub that workflows can access but humans can't read |
| **Health check** | An endpoint (like `/health`) that returns "ok" to prove the server is running |
