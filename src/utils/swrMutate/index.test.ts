import { describe, expect, it, vi } from "vitest";

import type { SWRKey } from "@/types";

import { swrMutate } from "./index";

describe("swrMutate", () => {
  it("should call mutate with key cast to any", async () => {
    const mockMutate = vi.fn().mockResolvedValue(undefined);
    const key: SWRKey = { data: "/api/todos", id: "todos" };
    const data = [{ id: 1, title: "Test" }];

    await swrMutate(mockMutate as any, key, data, false);

    expect(mockMutate).toHaveBeenCalledWith(key, data, false);
  });

  it("should work without data parameter", async () => {
    const mockMutate = vi.fn().mockResolvedValue(undefined);
    const key: SWRKey = { data: "/api/todos", group: "lists", id: "todos" };

    await swrMutate(mockMutate as any, key);

    expect(mockMutate).toHaveBeenCalledWith(key, undefined, undefined);
  });
});
