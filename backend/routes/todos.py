"""
routes/todos.py
---------------
All CRUD endpoints for the Todo resource, using SQLAlchemy.

Learning note — HTTP verbs map to CRUD:
    POST   → Create
    GET    → Read
    PATCH  → Update (partial)
    DELETE → Delete

Learning note — Depends(get_db):
    Every route receives a `db` session via FastAPI's dependency injection.
    This means you don't manually open/close database connections —
    get_db() handles that automatically (see database.py).

Learning note — SQLAlchemy query patterns:
    db.query(Todo)                  → SELECT * FROM todos
    .filter(Todo.id == "...")       → WHERE id = '...'
    .order_by(Todo.created_at.desc()) → ORDER BY created_at DESC
    .all()                          → return all matching rows as a list
    .first()                        → return the first match (or None)
    db.add(new_todo)                → stage a new row for INSERT
    db.commit()                     → actually write changes to the database
    db.refresh(todo)                → re-read the row from the database
                                      (to get server-generated values like id)
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Todo, TodoCreate, TodoUpdate, TodoResponse

router = APIRouter()


@router.get("/", response_model=list[TodoResponse])
def get_todos(db: Session = Depends(get_db)):
    """
    GET /todos/
    Returns all todos ordered by newest first.
    """
    todos = db.query(Todo).order_by(Todo.created_at.desc()).all()
    return todos


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(todo_id: UUID, db: Session = Depends(get_db)):
    """
    GET /todos/{todo_id}
    Returns a single todo by its UUID.
    """
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.post("/", response_model=TodoResponse, status_code=201)
def create_todo(payload: TodoCreate, db: Session = Depends(get_db)):
    """
    POST /todos/
    Creates a new todo.

    We unpack the Pydantic model into keyword arguments for the
    SQLAlchemy model constructor: Todo(title="...", description="...", ...)
    """
    new_todo = Todo(**payload.model_dump())
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)  # populates id and created_at from the database
    return new_todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: UUID, payload: TodoUpdate, db: Session = Depends(get_db)):
    """
    PATCH /todos/{todo_id}
    Partially updates a todo — only changes the fields the client sends.

    setattr(todo, key, value) is Python's way of doing todo.title = value
    when the field name is a variable (string).
    """
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    for key, value in updates.items():
        setattr(todo, key, value)

    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: UUID, db: Session = Depends(get_db)):
    """
    DELETE /todos/{todo_id}
    Deletes a todo. Returns 204 No Content on success.
    """
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    db.delete(todo)
    db.commit()
