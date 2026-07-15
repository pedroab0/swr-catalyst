import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SWRKey } from "@/types";

import { rollbackOptimisticUpdate } from "./index";

const mutate = vi.fn();

describe("rollbackOptimisticUpdate", () => {
  const testKey: SWRKey = { data: "/api/todos", id: "todos" };

  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockResolvedValue(undefined);
  });

  it("should call mutate with original data and false revalidate flag", async () => {
    const originalData = [
      { id: 1, title: "Todo 1" },
      { id: 2, title: "Todo 2" },
    ];

    await rollbackOptimisticUpdate(mutate, testKey, originalData);

    expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("should handle undefined original data", async () => {
    await rollbackOptimisticUpdate(mutate, testKey, undefined);

    expect(mutate).toHaveBeenCalledWith(testKey, undefined, false);
  });

  it("should handle null original data", async () => {
    await rollbackOptimisticUpdate(mutate, testKey, null);

    expect(mutate).toHaveBeenCalledWith(testKey, null, false);
  });

  it("should handle empty array original data", async () => {
    await rollbackOptimisticUpdate(mutate, testKey, []);

    expect(mutate).toHaveBeenCalledWith(testKey, [], false);
  });

  it("should handle object original data", async () => {
    const originalData = { count: 0, items: [] };

    await rollbackOptimisticUpdate(mutate, testKey, originalData);

    expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
  });

  it("should handle string key", async () => {
    const stringKey: SWRKey = { data: "/api/users", id: "users" };
    const originalData = [{ id: 1, name: "User 1" }];

    await rollbackOptimisticUpdate(mutate, stringKey, originalData);

    expect(mutate).toHaveBeenCalledWith(stringKey, originalData, false);
  });

  it("should return a promise that resolves", async () => {
    const result = rollbackOptimisticUpdate(mutate, testKey, []);

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  it("should propagate mutate errors", async () => {
    const error = new Error("Mutate failed");
    mutate.mockRejectedValue(error);

    await expect(rollbackOptimisticUpdate(mutate, testKey, [])).rejects.toThrow(
      "Mutate failed"
    );
  });

  it("should handle complex nested data structures", async () => {
    const originalData = {
      meta: { count: 1, lastUpdated: Date.now() },
      todos: [{ id: 1, subtasks: [{ done: false, id: 1 }], title: "Todo 1" }],
    };

    await rollbackOptimisticUpdate(mutate, testKey, originalData);

    expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
  });

  it("should always pass false as revalidate flag", async () => {
    const originalData = [{ id: 1 }];

    await rollbackOptimisticUpdate(mutate, testKey, originalData);

    const callArgs = mutate.mock.calls[0];
    expect(callArgs[2]).toBe(false);
  });
});
