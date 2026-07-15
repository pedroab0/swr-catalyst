import type { Todo, ValidationErrorResponse } from "../types";

import { ApiError } from "../errors";

async function handleResponse<T>(
  res: Response,
  errorMessage: string
): Promise<T> {
  if (!res.ok) {
    let body: ValidationErrorResponse | undefined;

    try {
      body = await res.json();
    } catch {
      // Response may not be JSON
    }

    throw new ApiError(body?.error || errorMessage, res.status, body);
  }

  return res.json();
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("/api/todos");

  return handleResponse<Todo[]>(res, "Failed to fetch todos");
}

export async function fetchTodoById(id: number): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`);

  return handleResponse<Todo>(res, `Failed to fetch todo ${id}`);
}

export async function createTodo(todo: Todo): Promise<Todo> {
  const res = await fetch("/api/todos", {
    body: JSON.stringify(todo),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return handleResponse<Todo>(res, "Failed to create todo");
}

export async function updateTodo(
  id: string | number,
  data: Partial<{ title: string; completed: boolean }>
): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

  return handleResponse<Todo>(res, `Failed to update todo ${id}`);
}

export async function deleteTodo(
  id: string | number
): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`/api/todos/${id}`, {
    method: "DELETE",
  });

  return handleResponse<{ success: boolean; id: number }>(
    res,
    `Failed to delete todo ${id}`
  );
}
