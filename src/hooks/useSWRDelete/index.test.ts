import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { SWRKey } from "@/types";

import { useSWRDelete } from "./index";

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

describe("useSWRDelete", () => {
  const testKey: SWRKey = { id: "todos", data: "/api/todos" };

  beforeEach(() => {
    mutate.mockClear();
    cacheGet.mockClear();
  });

  it("should set isMutating state during deletion", async () => {
    let resolvePromise: (value: unknown) => void;
    const deleteFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );
    const { result } = renderHook(() => useSWRDelete(testKey, deleteFn));

    act(() => {
      result.current.trigger(1);
    });

    await waitFor(() => expect(result.current.isMutating).toBe(true));

    await act(() => {
      resolvePromise({});
    });

    expect(result.current.isMutating).toBe(false);
  });

  it("should set the error state on failure", async () => {
    const error = new Error("Failed");
    const deleteFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useSWRDelete(testKey, deleteFn));

    await act(async () => {
      try {
        await result.current.trigger(1);
      } catch (_e) {
        // ignore
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.name).toBe("MutationError");
    expect((result.current.error as any).originalError).toBe(error);
    expect(result.current.isMutating).toBe(false);
  });

  it("should apply optimistic delete by filtering out item", async () => {
    const deleteFn = vi.fn().mockResolvedValue({ success: true });
    const optimisticUpdate = vi.fn((current, id) =>
      (current || []).filter((item: any) => item.id !== id)
    );

    cacheGet.mockReturnValue({
      data: [
        { id: 1, title: "First" },
        { id: 2, title: "Second" },
      ],
    });

    const { result } = renderHook(() =>
      useSWRDelete(testKey, deleteFn, { optimisticUpdate })
    );

    await act(async () => {
      await result.current.trigger(1);
    });

    expect(optimisticUpdate).toHaveBeenCalledWith(
      [
        { id: 1, title: "First" },
        { id: 2, title: "Second" },
      ],
      1
    );
  });

  it("should rollback optimistic delete on error", async () => {
    const error = new Error("Delete failed");
    const deleteFn = vi.fn().mockRejectedValue(error);
    const originalData = [
      { id: 1, title: "First" },
      { id: 2, title: "Second" },
    ];

    cacheGet.mockReturnValue({ data: originalData });

    const { result } = renderHook(() =>
      useSWRDelete(testKey, deleteFn, {
        optimisticUpdate: (current: any[] | undefined, id: any) =>
          (current || []).filter((item: any) => item.id !== id),
        rollbackOnError: true,
      })
    );

    await act(async () => {
      try {
        await result.current.trigger(1);
      } catch (_e) {
        // ignore
      }
    });

    expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
  });

  it("should return result from delete API", async () => {
    const deleteResult = { success: true, deletedId: 1 };
    const deleteFn = vi.fn().mockResolvedValue(deleteResult);

    const { result } = renderHook(() => useSWRDelete(testKey, deleteFn));

    let returnedData: unknown;
    await act(async () => {
      returnedData = await result.current.trigger(1);
    });

    expect(returnedData).toEqual(deleteResult);
  });
});
