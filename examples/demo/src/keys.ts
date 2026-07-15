import type { SWRKey } from "swr-catalyst";

export const todosKey: SWRKey<string> = {
  data: "/api/todos",
  group: "tasks",
  id: "todos",
};

export const todosSummaryKey: SWRKey<string> = {
  data: "/api/todos?view=summary",
  group: "tasks",
  id: "todos-summary",
};

export const appConfigKey: SWRKey<string> = {
  data: "/api/config",
  group: "meta",
  id: "app-config",
};
