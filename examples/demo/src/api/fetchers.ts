import { getDataMode } from "@demo/features/core/dataMode";
import type { TodoInput, TodoUpdate } from "@demo/types";

import {
  createTodoDirect,
  deleteTodoDirect,
  getAppConfigDirect,
  getTodosDirect,
  getTodosSummaryDirect,
  updateTodoDirect,
} from "./directApi";
import {
  createTodoHttp,
  deleteTodoHttp,
  fetchAppConfigHttp,
  fetchTodosHttp,
  fetchTodosSummaryHttp,
  updateTodoHttp,
} from "./httpApi";

function isMswMode() {
  return getDataMode() === "msw";
}

export function fetchTodos() {
  if (isMswMode()) {
    return fetchTodosHttp();
  }

  return getTodosDirect();
}

export function fetchTodosSummary() {
  if (isMswMode()) {
    return fetchTodosSummaryHttp();
  }

  return getTodosSummaryDirect();
}

export function fetchAppConfig() {
  if (isMswMode()) {
    return fetchAppConfigHttp();
  }

  return getAppConfigDirect();
}

export function createTodoApi(input: TodoInput) {
  if (isMswMode()) {
    return createTodoHttp(input);
  }

  return createTodoDirect(input);
}

export function updateTodoApi(id: string | number, update: TodoUpdate) {
  if (isMswMode()) {
    return updateTodoHttp(id, update);
  }

  return updateTodoDirect(id, update);
}

export function deleteTodoApi(id: string | number) {
  if (isMswMode()) {
    return deleteTodoHttp(id);
  }

  return deleteTodoDirect(id);
}
