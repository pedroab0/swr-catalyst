import { describe, expect, it, vi } from "vitest";

import type { SWRKey } from "@/types";

import { swrGetCache } from "./index";

describe("swrGetCache", () => {
  it("should get cache entry for valid key", () => {
    const key: SWRKey = { id: "todos", data: "/api/todos" };
    const cachedData = {
      data: [{ id: 1, title: "Test" }],
      isValidating: false,
    };

    const mockCache = new Map();
    mockCache.get = vi.fn().mockReturnValue(cachedData);

    const result = swrGetCache(mockCache as any, key);

    expect(mockCache.get).toHaveBeenCalledWith(key);
    expect(result).toBe(cachedData);
  });

  it("should return undefined for null key", () => {
    const mockCache = new Map();
    mockCache.get = vi.fn();

    const result = swrGetCache(mockCache as any, null);

    expect(mockCache.get).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should handle cache miss", () => {
    const key: SWRKey = { id: "todos", data: "/api/todos" };
    const mockCache = new Map();
    mockCache.get = vi.fn().mockReturnValue(undefined);

    const result = swrGetCache(mockCache as any, key);

    expect(mockCache.get).toHaveBeenCalledWith(key);
    expect(result).toBeUndefined();
  });
});
