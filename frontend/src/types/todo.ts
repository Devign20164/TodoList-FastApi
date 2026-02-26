/**
 * types/todo.ts
 * -------------
 * TypeScript interfaces that mirror the Pydantic models in the backend.
 *
 * Keeping types in one place means:
 *   - Your editor gives you autocomplete everywhere you use a Todo.
 *   - If the API shape changes, you only update one file.
 *
 * Learning note:
 *   These are INTERFACES, not classes. They're erased at runtime — they
 *   only exist to help TypeScript catch mistakes at compile time.
 */

/** A todo as returned by the API (GET, POST, PATCH responses). */
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string; // ISO 8601 date string, e.g. "2026-02-26T00:00:00Z"
}

/** Payload sent to POST /todos/ */
export interface TodoCreate {
  title: string;
  description?: string;
  completed?: boolean;
}

/** Payload sent to PATCH /todos/{id} — all fields optional */
export interface TodoUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
}
