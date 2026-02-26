/**
 * TodoForm.tsx
 * ------------
 * A controlled form for creating a new todo.
 *
 * Learning note — controlled components:
 *   In React, "controlled" means the form field value is stored in state
 *   (via useState) rather than in the DOM. Every keystroke updates state,
 *   and state drives the displayed value. This gives React full control.
 */

import { useState, type FormEvent } from "react";
import type { TodoCreate } from "../types/todo";

interface Props {
  onSubmit: (payload: TodoCreate) => Promise<void>;
}

export default function TodoForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // prevent page reload (default form behaviour)
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim() || undefined });
      setTitle("");
      setDescription("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <h2>Add a new todo</h2>
      <div className="form-group">
        <input
          type="text"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading || !title.trim()}>
        {loading ? "Adding…" : "Add Todo"}
      </button>
    </form>
  );
}
