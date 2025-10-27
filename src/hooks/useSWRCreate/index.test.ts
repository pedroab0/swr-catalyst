import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { SWRKey } from "@/types";

import { useSWRCreate } from "./index";

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

describe("useSWRCreate", () => {
  beforeEach(() => {
    mutate.mockClear();
    cacheGet.mockClear();
  });

  it("should set isMutating state during creation", async () => {
    let resolvePromise: (value: unknown) => void;
    const createFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );
    const testKey: SWRKey = { id: "test-key", data: "/api/test" };
    const { result } = renderHook(() => useSWRCreate(testKey, createFn));

    act(() => {
      result.current.trigger({});
    });

    await waitFor(() => expect(result.current.isMutating).toBe(true));

    await act(() => {
      resolvePromise({});
    });

    expect(result.current.isMutating).toBe(false);
  });

  it("should set the error state on failure", async () => {
    const error = new Error("Failed");
    const createFn = vi.fn().mockRejectedValue(error);
    const testKey: SWRKey = { id: "test-key", data: "/api/test" };
    const { result } = renderHook(() => useSWRCreate(testKey, createFn));

    await act(async () => {
      try {
        await result.current.trigger({});
      } catch (_e) {
        // ignore
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.name).toBe("MutationError");
    expect((result.current.error as any).originalError).toBe(error);
    expect(result.current.isMutating).toBe(false);
  });

  it("should apply optimistic update before API call", async () => {
    const createFn = vi.fn().mockResolvedValue({ id: 1, title: "New" });
    const testKey: SWRKey = { id: "test-key", data: "/api/test" };
    const optimisticUpdate = vi.fn((current, newData) => [
      ...(current || []),
      newData,
    ]);

    cacheGet.mockReturnValue({ data: [{ id: 0, title: "Old" }] });

    const { result } = renderHook(() =>
      useSWRCreate(testKey, createFn, { optimisticUpdate })
    );

    await act(async () => {
      await result.current.trigger({ title: "New" });
    });

    expect(optimisticUpdate).toHaveBeenCalledWith([{ id: 0, title: "Old" }], {
      title: "New",
    });
    expect(mutate).toHaveBeenCalledTimes(2);
  });

  it("should rollback optimistic update on error", async () => {
    const error = new Error("API Error");
    const createFn = vi.fn().mockRejectedValue(error);
    const testKey: SWRKey = { id: "test-key", data: "/api/test" };
    const originalData = [{ id: 1, title: "Original" }];

    cacheGet.mockReturnValue({ data: originalData });

    const { result } = renderHook(() =>
      useSWRCreate(testKey, createFn, {
        optimisticUpdate: (current: any[] | undefined, newData: any) => [
          ...(current || []),
          newData,
        ],
        rollbackOnError: true,
      })
    );

    await act(async () => {
      try {
        await result.current.trigger({ title: "New" });
      } catch (_e) {
        // ignore
      }
    });

    expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
  });

  it("should not rollback when rollbackOnError is false", async () => {
    const error = new Error("API Error");
    const createFn = vi.fn().mockRejectedValue(error);
    const testKey: SWRKey = { id: "test-key", data: "/api/test" };

    cacheGet.mockReturnValue({ data: [] });

    const { result } = renderHook(() =>
      useSWRCreate(testKey, createFn, {
        optimisticUpdate: (current: any[] | undefined, newData: any) => [
          ...(current || []),
          newData,
        ],
        rollbackOnError: false,
      })
    );

    await act(async () => {
      try {
        await result.current.trigger({ title: "New" });
      } catch (_e) {
        // ignore
      }
    });

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("should clear error state on successful retry", async () => {
    const createFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("First fail"))
      .mockResolvedValueOnce({ id: 1 });

    const testKey: SWRKey = { id: "test-key", data: "/api/test" };
    const { result } = renderHook(() => useSWRCreate(testKey, createFn));

    await act(async () => {
      try {
        await result.current.trigger({});
      } catch (_e) {
        // ignore
      }
    });

    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.trigger({});
    });

    expect(result.current.error).toBeNull();
  });

  it("should return created data from trigger", async () => {
    const createdData = { id: 123, title: "Created" };
    const createFn = vi.fn().mockResolvedValue(createdData);
    const testKey: SWRKey = { id: "test-key", data: "/api/test" };

    const { result } = renderHook(() => useSWRCreate(testKey, createFn));

    let returnedData: unknown;
    await act(async () => {
      returnedData = await result.current.trigger({ title: "New" });
    });

    expect(returnedData).toEqual(createdData);
  });
});
