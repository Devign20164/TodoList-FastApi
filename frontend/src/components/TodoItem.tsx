/**
 * TodoItem.tsx
 * ------------
 * Renders a single todo with inline edit, toggle complete, and delete.
 *
 * Learning note — lifting state up:
 *   This component doesn't store the todo in its own state.
 *   Instead it receives the todo as a prop and calls callback props
 *   (onToggle, onDelete, onUpdate) to let the parent page update the list.
 *   This pattern is called "lifting state up" — keep data in one place
 *   so the whole UI stays in sync.
 */

import { useState } from "react";
import type { Todo } from "../types/todo";

interface Props {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, title: string, description: string) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await onUpdate(todo.id, editTitle.trim(), editDesc.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditTitle(todo.title);
    setEditDesc(todo.description ?? "");
    setEditing(false);
  }

  return (
    <li className={`todo-item ${todo.completed ? "completed" : ""}`}>
      {editing ? (
        <div className="todo-edit">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={saving}
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={2}
            disabled={saving}
          />
          <div className="todo-edit-actions">
            <button onClick={handleSave} disabled={saving || !editTitle.trim()}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={handleCancel} disabled={saving} className="secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="todo-content">
          <label className="todo-check">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id, !todo.completed)}
            />
            <span className="todo-title">{todo.title}</span>
          </label>
          {todo.description && (
            <p className="todo-description">{todo.description}</p>
          )}
          <span className="todo-date">
            {new Date(todo.created_at).toLocaleDateString()}
          </span>
        </div>
      )}

      {!editing && (
        <div className="todo-actions">
          <button onClick={() => setEditing(true)} className="secondary">
            Edit
          </button>
          <button onClick={() => onDelete(todo.id)} className="danger">
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
