/**
 * TodosPage.tsx
 * -------------
 * The main page. Owns the todos state and orchestrates all API calls.
 *
 * Learning note — useEffect:
 *   useEffect(() => { ... }, []) runs the callback once after the component
 *   first mounts (appears on screen). The empty [] dependency array means
 *   "only run this effect once". This is where you fetch initial data.
 *
 * Learning note — async state updates:
 *   We always update local state after a successful API call rather than
 *   re-fetching the entire list. This makes the UI feel instant.
 */

import { useEffect, useState } from "react";
import type { Todo, TodoCreate } from "../types/todo";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../api/todos";
import TodoForm from "../components/TodoForm";
import TodoItem from "../components/TodoItem";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todos once on mount
  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setError("Failed to load todos. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(payload: TodoCreate) {
    const created = await createTodo(payload);
    // Prepend the new todo so it appears at the top immediately
    setTodos((prev) => [created, ...prev]);
  }

  async function handleToggle(id: string, completed: boolean) {
    const updated = await updateTodo(id, { completed });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleUpdate(id: string, title: string, description: string) {
    const updated = await updateTodo(id, {
      title,
      description: description || undefined,
    });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const pending = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Todos</h1>
        <p className="subtitle">FastAPI · React · Supabase</p>
      </header>

      <TodoForm onSubmit={handleCreate} />

      {loading && <p className="status-msg">Loading todos…</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && (
        <>
          <section>
            <h3 className="section-title">
              Pending <span className="badge">{pending.length}</span>
            </h3>
            {pending.length === 0 ? (
              <p className="empty-msg">Nothing pending. Great job!</p>
            ) : (
              <ul className="todo-list">
                {pending.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 && (
            <section>
              <h3 className="section-title">
                Completed <span className="badge">{done.length}</span>
              </h3>
              <ul className="todo-list">
                {done.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
