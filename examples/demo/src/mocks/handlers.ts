import { getScenario } from "@demo/features/scenario/scenario";
import type { TodoInput, TodoUpdate } from "@demo/types";
import { HttpResponse, http } from "msw";

import {
  createTodo,
  deleteTodo,
  getAppConfig,
  getTodos,
  getTodosSummary,
  updateTodo,
} from "./dataStore";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

async function maybeDelay() {
  const { delayMs } = getScenario();
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

function shouldFailNetwork() {
  return getScenario().failureMode === "network";
}

function shouldFailValidation() {
  return getScenario().failureMode === "validation";
}

function getValidationMessage(title?: string) {
  if (!title || title.trim().length < 3) {
    return "Title must have at least 3 characters.";
  }

  return "Validation mode enabled. Use normal mode to continue.";
}

export const handlers = [
  http.get("/api/config", async () => {
    await maybeDelay();

    if (shouldFailNetwork()) {
      return HttpResponse.error();
    }

    return HttpResponse.json(getAppConfig(), { headers: DEFAULT_HEADERS });
  }),
  http.get("/api/todos", async ({ request }) => {
    await maybeDelay();

    if (shouldFailNetwork()) {
      return HttpResponse.error();
    }

    const requestUrl = new URL(request.url);
    const view = requestUrl.searchParams.get("view");

    if (view === "summary") {
      return HttpResponse.json(getTodosSummary(), {
        headers: DEFAULT_HEADERS,
      });
    }

    return HttpResponse.json(getTodos(), { headers: DEFAULT_HEADERS });
  }),
  http.post("/api/todos", async ({ request }) => {
    await maybeDelay();

    if (shouldFailNetwork()) {
      return HttpResponse.error();
    }

    const payload = (await request.json()) as TodoInput;
    if (shouldFailValidation()) {
      return HttpResponse.json(
        {
          message: getValidationMessage(payload.title),
          code: "VALIDATION_ERROR",
        },
        {
          status: 422,
          headers: DEFAULT_HEADERS,
        }
      );
    }

    const created = createTodo(payload);
    return HttpResponse.json(created, {
      status: 201,
      headers: DEFAULT_HEADERS,
    });
  }),
  http.patch("/api/todos/:id", async ({ params, request }) => {
    await maybeDelay();

    if (shouldFailNetwork()) {
      return HttpResponse.error();
    }

    const payload = (await request.json()) as TodoUpdate;
    if (shouldFailValidation()) {
      return HttpResponse.json(
        {
          message: getValidationMessage(payload.title),
          code: "VALIDATION_ERROR",
        },
        {
          status: 422,
          headers: DEFAULT_HEADERS,
        }
      );
    }

    const todoId = Number(params.id);
    const updated = updateTodo(todoId, payload);

    if (!updated) {
      return HttpResponse.json(
        { message: `Todo ${todoId} not found.` },
        { status: 404, headers: DEFAULT_HEADERS }
      );
    }

    return HttpResponse.json(updated, { headers: DEFAULT_HEADERS });
  }),
  http.delete("/api/todos/:id", async ({ params }) => {
    await maybeDelay();

    if (shouldFailNetwork()) {
      return HttpResponse.error();
    }

    const todoId = Number(params.id);
    const deleted = deleteTodo(todoId);
    if (!deleted) {
      return HttpResponse.json(
        { message: `Todo ${todoId} not found.` },
        { status: 404, headers: DEFAULT_HEADERS }
      );
    }

    return HttpResponse.json(deleted, { headers: DEFAULT_HEADERS });
  }),
];
