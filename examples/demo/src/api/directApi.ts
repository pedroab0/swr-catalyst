import type {
  AppConfig,
  Todo,
  TodoInput,
  TodosSummary,
  TodoUpdate,
} from "../types";

import {
  createTodo,
  deleteTodo,
  getAppConfig,
  getTodos,
  getTodosSummary,
  updateTodo,
} from "../mocks/dataStore";
import { getScenario } from "../state/scenario";

async function maybeDelay() {
  const { delayMs } = getScenario();
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

function failNetworkIfNeeded() {
  if (getScenario().failureMode === "network") {
    throw new Error("Network request failed.");
  }
}

function failValidationIfNeeded(title?: string) {
  if (getScenario().failureMode !== "validation") {
    return;
  }

  if (!title || title.trim().length < 3) {
    throw new Error("Title must have at least 3 characters.");
  }

  throw new Error("Validation mode enabled. Use normal mode to continue.");
}

export async function getTodosDirect(): Promise<Todo[]> {
  await maybeDelay();
  failNetworkIfNeeded();
  return getTodos();
}

export async function getTodosSummaryDirect(): Promise<TodosSummary> {
  await maybeDelay();
  failNetworkIfNeeded();
  return getTodosSummary();
}

export async function getAppConfigDirect(): Promise<AppConfig> {
  await maybeDelay();
  failNetworkIfNeeded();
  return getAppConfig();
}

export async function createTodoDirect(input: TodoInput): Promise<Todo> {
  await maybeDelay();
  failNetworkIfNeeded();
  failValidationIfNeeded(input.title);
  return createTodo(input);
}

export async function updateTodoDirect(
  id: string | number,
  update: TodoUpdate
): Promise<Todo> {
  await maybeDelay();
  failNetworkIfNeeded();
  failValidationIfNeeded(update.title);

  const updated = updateTodo(Number(id), update);
  if (!updated) {
    throw new Error(`Todo ${id} not found.`);
  }

  return updated;
}

export async function deleteTodoDirect(
  id: string | number
): Promise<{ deletedId: number }> {
  await maybeDelay();
  failNetworkIfNeeded();

  const deleted = deleteTodo(Number(id));
  if (!deleted) {
    throw new Error(`Todo ${id} not found.`);
  }

  return deleted;
}
