import type {
  AppConfig,
  Todo,
  TodoInput,
  TodosSummary,
  TodoUpdate,
} from "@demo/types";

type ApiErrorBody = {
  message?: string;
};

async function request<TResponse>(
  input: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;

    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.message) {
        errorMessage = body.message;
      }
    } catch {
      // Keep default message when response body is unavailable.
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<TResponse>;
}

export function fetchTodosHttp() {
  return request<Todo[]>("/api/todos");
}

export function fetchTodosSummaryHttp() {
  return request<TodosSummary>("/api/todos?view=summary");
}

export function fetchAppConfigHttp() {
  return request<AppConfig>("/api/config");
}

export function createTodoHttp(input: TodoInput) {
  return request<Todo>("/api/todos", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateTodoHttp(id: string | number, update: TodoUpdate) {
  return request<Todo>(`/api/todos/${id}`, {
    body: JSON.stringify(update),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteTodoHttp(id: string | number) {
  return request<{ deletedId: number }>(`/api/todos/${id}`, {
    method: "DELETE",
  });
}
