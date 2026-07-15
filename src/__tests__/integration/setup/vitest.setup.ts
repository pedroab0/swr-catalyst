import { afterAll, afterEach, beforeAll } from "vitest";

beforeAll(async () => {
  const { server } = await import("./server");
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(async () => {
  const { resetServerData, server } = await import("./server");
  server.resetHandlers();
  resetServerData();
});

afterAll(async () => {
  const { server } = await import("./server");
  server.close();
});
