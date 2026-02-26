"""
models.py
---------
This file has TWO kinds of models — a common source of confusion at first:

1. SQLAlchemy model (Todo class)
   → Defines the actual database TABLE. Each instance = one row.
   → Think of it like CREATE TABLE in SQL.

2. Pydantic models (TodoCreate, TodoUpdate, TodoResponse)
   → Define the shape of JSON flowing in and out of the API.
   → Think of them like TypeScript interfaces.

Why both?
    SQLAlchemy models map to database rows.
    Pydantic models validate HTTP request/response bodies.
    They serve different layers: database vs API.

    In real production apps you'll almost always see both.
"""

import uuid as _uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import Column, Text, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base


# ---------------------------------------------------------------------------
# SQLAlchemy model — represents the "todos" TABLE in PostgreSQL
# ---------------------------------------------------------------------------
class Todo(Base):
    """
    Each attribute maps to a column in the `todos` table.

    __tablename__ tells SQLAlchemy which table this class maps to.
    If you already created the table in Supabase's SQL editor, SQLAlchemy
    will connect to that existing table (it won't duplicate it).
    """
    __tablename__ = "todos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Pydantic models — define the shape of API request / response bodies
# ---------------------------------------------------------------------------
class TodoCreate(BaseModel):
    """Payload for POST /todos — creating a new todo."""
    title: str
    description: Optional[str] = None
    completed: bool = False


class TodoUpdate(BaseModel):
    """
    Payload for PATCH /todos/{id} — partial update.

    Every field is Optional so the client only needs to send the fields
    they want to change. This is what makes it a PATCH (partial update)
    rather than a PUT (full replacement).
    """
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class TodoResponse(BaseModel):
    """Shape of a todo returned by the API."""
    id: _uuid.UUID
    title: str
    description: Optional[str] = None
    completed: bool
    created_at: datetime

    # from_attributes=True tells Pydantic to read data from SQLAlchemy model
    # attributes (todo.title) instead of dict keys (todo["title"]).
    # Pydantic automatically serialises UUID to a string in JSON output.
    model_config = {"from_attributes": True}
