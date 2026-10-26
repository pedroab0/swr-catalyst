import { afterAll, afterEach, beforeAll } from "vitest";

beforeAll(async () => {
  const { server } = await import("./server");
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(async () => {
  const { resetServerData, server } = await import("./server");
  server.resetHandlers();
  server.close();
  server.listen({ onUnhandledFrame: "error" });
  resetServerData();
});

afterAll(async () => {
  const { server } = await import("./server");
  server.close();
});
