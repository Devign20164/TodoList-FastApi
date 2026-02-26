/**
 * api/todos.ts
 * ------------
 * All HTTP calls to the FastAPI backend live here.
 *
 * We create a single axios instance (apiClient) configured with the base URL
 * from the .env file. Every function in this module calls one endpoint and
 * returns strongly-typed data thanks to TypeScript generics.
 *
 * Learning note:
 *   axios.get<T>() means "parse the JSON response body as type T".
 *   response.data is where axios puts the parsed body.
 *
 *   async/await is the modern way to handle Promises (async operations).
 *   It reads like synchronous code but doesn't block the browser.
 */

import axios from "axios";
import type { Todo, TodoCreate, TodoUpdate } from "../types/todo";

// Create a reusable axios instance so we don't repeat the base URL everywhere.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Fetch all todos (newest first). */
export async function getTodos(): Promise<Todo[]> {
  const response = await apiClient.get<Todo[]>("/todos/");
  return response.data;
}

/** Fetch a single todo by id. */
export async function getTodo(id: string): Promise<Todo> {
  const response = await apiClient.get<Todo>(`/todos/${id}`);
  return response.data;
}

/** Create a new todo. Returns the created todo including its generated id. */
export async function createTodo(payload: TodoCreate): Promise<Todo> {
  const response = await apiClient.post<Todo>("/todos/", payload);
  return response.data;
}

/** Partially update a todo. Only sends the fields you provide. */
export async function updateTodo(id: string, payload: TodoUpdate): Promise<Todo> {
  const response = await apiClient.patch<Todo>(`/todos/${id}`, payload);
  return response.data;
}

/** Delete a todo. Returns nothing (204 No Content). */
export async function deleteTodo(id: string): Promise<void> {
  await apiClient.delete(`/todos/${id}`);
}
