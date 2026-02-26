"""
database.py
-----------
Sets up the SQLAlchemy connection to your Supabase PostgreSQL database.

Key concepts:
    Engine        — manages the actual database connection pool.
                    Think of it like a phone line to the database.
    SessionLocal  — a factory that creates "sessions". Each session is
                    one conversation with the database (begin, query, commit/rollback, close).
    Base          — a parent class for all your table models. SQLAlchemy
                    uses it to know which tables exist.
    get_db()      — a FastAPI "dependency" that gives each request its own
                    session and guarantees it gets closed afterwards.

Learning note — what is a "dependency" in FastAPI?
    When a route parameter has `db: Session = Depends(get_db)`, FastAPI:
      1. Calls get_db() before your route runs.
      2. Passes the yielded session as `db`.
      3. After the route finishes (or crashes), resumes get_db() to close the session.
    This pattern is called Dependency Injection — the framework "injects"
    the thing your function needs so you don't have to create it yourself.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

load_dotenv()

DATABASE_URL: str = os.environ["DATABASE_URL"]

# pool_pre_ping=True tests each connection before using it.
# This avoids errors when the database closes idle connections.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Every SQLAlchemy model (table class) will inherit from Base.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.

    `yield` pauses the function and hands the session to the route.
    The `finally` block runs after the route returns (even if it errors),
    ensuring the connection is always returned to the pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
