import type { SWRKey } from "swr-catalyst";

export const todosKey: SWRKey<string> = {
  id: "todos",
  group: "tasks",
  data: "/api/todos",
};

export const todosSummaryKey: SWRKey<string> = {
  id: "todos-summary",
  group: "tasks",
  data: "/api/todos?view=summary",
};

export const appConfigKey: SWRKey<string> = {
  id: "app-config",
  group: "meta",
  data: "/api/config",
};
