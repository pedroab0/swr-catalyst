import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SWRKey } from "@/types";

import { applyOptimisticUpdate } from "./index";

const mutate = vi.fn();
const cacheGet = vi.fn();
const cacheSet = vi.fn();
const cache = {
  get: cacheGet,
  set: cacheSet,
  delete: vi.fn(),
  keys: vi.fn(() => []),
} as any;

describe("applyOptimisticUpdate", () => {
  const testKey: SWRKey = { id: "todos", data: "/api/todos" };

  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockResolvedValue(undefined);
  });

  it("should apply optimistic update and return original data", async () => {
    const originalData = [
      { id: 1, title: "Todo 1" },
      { id: 2, title: "Todo 2" },
    ];

    cacheGet.mockReturnValue({ data: originalData });

    const newTodo = { id: 3, title: "New Todo" };
    const optimisticUpdateFn = vi.fn(
      (current: any[] | undefined, data: any) => [...(current || []), data]
    );

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: newTodo,
      optimisticUpdateFn,
    });

    expect(result).toEqual(originalData);
    expect(optimisticUpdateFn).toHaveBeenCalledWith(originalData, newTodo);
    expect(mutate).toHaveBeenCalledWith(
      testKey,
      [...originalData, newTodo],
      false
    );
  });

  it("should handle undefined cache data", async () => {
    cacheGet.mockReturnValue(undefined);

    const newTodo = { id: 1, title: "First Todo" };
    const optimisticUpdateFn = vi.fn((_current: any, data: any) => [data]);

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: newTodo,
      optimisticUpdateFn,
    });

    expect(result).toBeUndefined();
    expect(optimisticUpdateFn).toHaveBeenCalledWith(undefined, newTodo);
    expect(mutate).toHaveBeenCalledWith(testKey, [newTodo], false);
  });

  it("should handle cache with undefined data property", async () => {
    cacheGet.mockReturnValue({ data: undefined });

    const newTodo = { id: 1, title: "First Todo" };
    const optimisticUpdateFn = vi.fn((current: any, data: any) =>
      current ? [...current, data] : [data]
    );

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: newTodo,
      optimisticUpdateFn,
    });

    expect(result).toBeUndefined();
    expect(optimisticUpdateFn).toHaveBeenCalledWith(undefined, newTodo);
  });

  it("should apply optimistic update for item update", async () => {
    const originalData = [
      { id: 1, title: "Todo 1" },
      { id: 2, title: "Todo 2" },
    ];

    cacheGet.mockReturnValue({ data: originalData });

    const updateData = { id: 1, title: "Updated Todo 1" };
    const optimisticUpdateFn = vi.fn((current: any[] | undefined, data: any) =>
      (current || []).map((item) =>
        item.id === data.id ? { ...item, ...data } : item
      )
    );

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: updateData,
      optimisticUpdateFn,
    });

    expect(result).toEqual(originalData);
    expect(mutate).toHaveBeenCalledWith(
      testKey,
      [
        { id: 1, title: "Updated Todo 1" },
        { id: 2, title: "Todo 2" },
      ],
      false
    );
  });

  it("should apply optimistic update for item deletion", async () => {
    const originalData = [
      { id: 1, title: "Todo 1" },
      { id: 2, title: "Todo 2" },
    ];

    cacheGet.mockReturnValue({ data: originalData });

    const deleteId = 1;
    const optimisticUpdateFn = vi.fn((current: any[] | undefined, id: number) =>
      (current || []).filter((item) => item.id !== id)
    );

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: deleteId,
      optimisticUpdateFn,
    });

    expect(result).toEqual(originalData);
    expect(mutate).toHaveBeenCalledWith(
      testKey,
      [{ id: 2, title: "Todo 2" }],
      false
    );
  });

  it("should pass false as revalidate flag to mutate", async () => {
    cacheGet.mockReturnValue({ data: [] });

    const optimisticUpdateFn = vi.fn(() => [{ id: 1 }]);

    await applyOptimisticUpdate(cache, mutate, testKey, {
      data: { id: 1 },
      optimisticUpdateFn,
    });

    expect(mutate).toHaveBeenCalledWith(testKey, [{ id: 1 }], false);
  });

  it("should handle complex data transformations", async () => {
    const originalData = {
      items: [{ id: 1, title: "Todo 1" }],
      count: 1,
    };

    cacheGet.mockReturnValue({ data: originalData });

    const newItem = { id: 2, title: "Todo 2" };
    const optimisticUpdateFn = vi.fn((current: any, data: any) => ({
      items: [...current.items, data],
      count: current.count + 1,
    }));

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: newItem,
      optimisticUpdateFn,
    });

    expect(result).toEqual(originalData);
    expect(mutate).toHaveBeenCalledWith(
      testKey,
      {
        items: [
          { id: 1, title: "Todo 1" },
          { id: 2, title: "Todo 2" },
        ],
        count: 2,
      },
      false
    );
  });

  it("should handle null cache data", async () => {
    cacheGet.mockReturnValue({ data: null });

    const optimisticUpdateFn = vi.fn((current: any, data: any) =>
      current ? [...current, data] : [data]
    );

    const result = await applyOptimisticUpdate(cache, mutate, testKey, {
      data: { id: 1 },
      optimisticUpdateFn,
    });

    expect(result).toBeNull();
    expect(optimisticUpdateFn).toHaveBeenCalledWith(null, { id: 1 });
  });

  it("should work with different key types", async () => {
    const stringKey: SWRKey = { id: "todos-string", data: "/api/todos" };
    cacheGet.mockReturnValue({ data: [] });

    const optimisticUpdateFn = vi.fn(() => [{ id: 1 }]);

    await applyOptimisticUpdate(cache, mutate, stringKey, {
      data: { id: 1 },
      optimisticUpdateFn,
    });

    expect(mutate).toHaveBeenCalledWith(stringKey, [{ id: 1 }], false);
  });
});
