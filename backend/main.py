"""
main.py | ci pipeline to development
-------
Entry point for the FastAPI application.

This file:
  1. Creates the FastAPI app instance.
  2. Configures CORS so the React frontend (running on a different port) can talk to it.
  3. Registers routers (groups of routes).
  4. Ensures database tables exist on startup.
  5. Provides a health-check endpoint at GET /health.

Run the server with:
    uvicorn main:app --reload

    main  = this file (main.py)
    app   = the FastAPI() instance below
    --reload = auto-restart when you save a file (great for development)
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes.todos import router as todos_router

# Import models so SQLAlchemy knows about them when create_all runs.
# Without this import, Base.metadata has no tables registered.
import models  # noqa: F401

app = FastAPI(
    title="Todo API",
    description="A learning project: FastAPI + SQLAlchemy + React",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Create tables
# ---------------------------------------------------------------------------
# Base.metadata.create_all() looks at every class that inherits from Base
# (like Todo in models.py) and runs CREATE TABLE IF NOT EXISTS for each one.
# Since your todos table already exists in Supabase, this is a safe no-op.
# If you add new models later, they'll be created automatically on next start.
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# CORS (Cross-Origin Resource Sharing)
# ---------------------------------------------------------------------------
# Read allowed origins from the CORS_ORIGINS environment variable.
# This lets Docker Compose, Railway, or any deployment set the right
# origins without changing code. Falls back to localhost:5173 for
# local development without Docker.
# ---------------------------------------------------------------------------
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(todos_router, prefix="/todos", tags=["todos"])


@app.get("/health", tags=["health"])
def health_check():
    """Quick check that the server is running."""
    return {"status": "ok"}
