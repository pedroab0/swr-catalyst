import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { SWRKey } from "@/types";

import { useSWRUpdate } from "./index";

const mutate = vi.fn();
const cacheGet = vi.fn();
const cache = { get: cacheGet, set: vi.fn(), delete: vi.fn() };

vi.mock("swr", async (importOriginal) => {
  const original = await importOriginal<typeof import("swr")>();
  return {
    ...original,
    useSWRConfig: () => ({
      mutate,
      cache,
    }),
  };
});

describe("useSWRUpdate", () => {
  const testKey: SWRKey = { id: "todos", data: "/api/todos" };

  beforeEach(() => {
    mutate.mockClear();
    cacheGet.mockClear();
  });

  it("should set isMutating state during update", async () => {
    let resolvePromise: (value: unknown) => void;
    const updateFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );
    const { result } = renderHook(() => useSWRUpdate(testKey, updateFn));

    act(() => {
      result.current.trigger(1, {});
    });

    await waitFor(() => expect(result.current.isMutating).toBe(true));

    await act(() => {
      resolvePromise({});
    });

    expect(result.current.isMutating).toBe(false);
  });

  it("should set the error state on failure", async () => {
    const error = new Error("Failed");
    const updateFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useSWRUpdate(testKey, updateFn));

    await act(async () => {
      try {
        await result.current.trigger(1, {});
      } catch (_e) {
        // ignore
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.name).toBe("MutationError");
    expect((result.current.error as any).originalError).toBe(error);
    expect(result.current.isMutating).toBe(false);
  });

  it("should apply optimistic update with id and data", async () => {
    const updateFn = vi.fn().mockResolvedValue({ id: 1, title: "Updated" });
    const optimisticUpdate = vi.fn((current, { id, data }) =>
      (current || []).map((item: any) =>
        item.id === id ? { ...item, ...data } : item
      )
    );

    cacheGet.mockReturnValue({
      data: [
        { id: 1, title: "Old" },
        { id: 2, title: "Other" },
      ],
    });

    const { result } = renderHook(() =>
      useSWRUpdate(testKey, updateFn, { optimisticUpdate })
    );

    await act(async () => {
      await result.current.trigger(1, { title: "Updated" });
    });

    expect(optimisticUpdate).toHaveBeenCalledWith(
      [
        { id: 1, title: "Old" },
        { id: 2, title: "Other" },
      ],
      { id: 1, data: { title: "Updated" } }
    );
  });

  it("should rollback optimistic update on error", async () => {
    const error = new Error("Update failed");
    const updateFn = vi.fn().mockRejectedValue(error);
    const originalData = [{ id: 1, title: "Original" }];

    cacheGet.mockReturnValue({ data: originalData });

    const { result } = renderHook(() =>
      useSWRUpdate(testKey, updateFn, {
        optimisticUpdate: (current: any[] | undefined, { id, data }: any) =>
          (current || []).map((item: any) =>
            item.id === id ? { ...item, ...data } : item
          ),
        rollbackOnError: true,
      })
    );

    await act(async () => {
      try {
        await result.current.trigger(1, { title: "Updated" });
      } catch (_e) {
        // ignore
      }
    });

    expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
  });

  it("should return updated data from trigger", async () => {
    const updatedData = { id: 1, title: "Updated", completed: true };
    const updateFn = vi.fn().mockResolvedValue(updatedData);

    const { result } = renderHook(() => useSWRUpdate(testKey, updateFn));

    let returnedData: unknown;
    await act(async () => {
      returnedData = await result.current.trigger(1, { completed: true });
    });

    expect(returnedData).toEqual(updatedData);
  });
});
