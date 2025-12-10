import { afterAll, afterEach, beforeAll } from "vitest";

import { resetServerData, server } from "./server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  resetServerData();
});

afterAll(() => {
  server.close();
});
