import { act, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { mutateById } from "@/utils";
import { fetchTodos, renderHookWithGlobalCache, uniqueKeyId } from "../helpers";

describe("mutateById - Integration Tests", () => {
  it("should revalidate cache entries by ID", async () => {
    const keyId = uniqueKeyId("mutate-by-id-revalidate");

    const todosKey: SWRKey<Todo> = {
      data: { completed: false, id: 1, title: "" },
      id: keyId,
    };

    let fetchCount = 0;

    const countingFetcher = () => {
      fetchCount += 1;
      return fetchTodos();
    };

    const { result } = renderHookWithGlobalCache(() =>
      useSWR(todosKey, countingFetcher)
    );

    await waitFor(() => expect(result.current.data).toBeDefined());

    const initialFetchCount = fetchCount;

    expect(initialFetchCount).toBe(1);

    await act(async () => {
      await mutateById(keyId);
    });

    await waitFor(() => {
      expect(fetchCount).toBeGreaterThan(initialFetchCount);
    });

    expect(fetchCount).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it("should update cache entries by ID with new data", async () => {
    const keyId = uniqueKeyId("mutate-by-id-update");

    const todosKey: SWRKey<Todo> = {
      data: { completed: false, id: 1, title: "" },
      id: keyId,
    };

    const { result } = renderHookWithGlobalCache(() =>
      useSWR(todosKey, fetchTodos, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    );

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0].title).toBe("Test Todo 1");

    const newTodos: Todo[] = [
      { completed: true, id: 100, title: "Mutated Todo 1" },
      { completed: false, id: 101, title: "Mutated Todo 2" },
    ];

    await act(async () => {
      await mutateById(keyId, newTodos, { revalidate: false });
    });

    await waitFor(() => {
      expect(result.current.data?.length).toBe(2);
      expect(result.current.data?.[0].id).toBe(100);
      expect(result.current.data?.[0].title).toBe("Mutated Todo 1");
      expect(result.current.data?.[1].id).toBe(101);
      expect(result.current.data?.[1].title).toBe("Mutated Todo 2");
    });
  });

  it("should handle multiple IDs", async () => {
    const keyId1 = uniqueKeyId("mutate-multi-1");
    const keyId2 = uniqueKeyId("mutate-multi-2");

    const todosKey1: SWRKey<Todo> = {
      data: { completed: false, id: 1, title: "" },
      id: keyId1,
    };

    const todosKey2: SWRKey<Todo> = {
      data: { completed: false, id: 2, title: "" },
      id: keyId2,
    };

    let fetchCount1 = 0;
    let fetchCount2 = 0;

    const { result } = renderHookWithGlobalCache(() => {
      const swr1 = useSWR(todosKey1, () => {
        fetchCount1 += 1;

        return fetchTodos();
      });

      const swr2 = useSWR(todosKey2, () => {
        fetchCount2 += 1;

        return fetchTodos();
      });

      return { swr1, swr2 };
    });

    await waitFor(() => {
      expect(result.current.swr1.data).toBeDefined();
      expect(result.current.swr2.data).toBeDefined();
    });

    const initialCount1 = fetchCount1;
    const initialCount2 = fetchCount2;

    await act(async () => {
      await mutateById([keyId1, keyId2]);
    });

    await waitFor(() => {
      expect(fetchCount1).toBeGreaterThan(initialCount1);
      expect(fetchCount2).toBeGreaterThan(initialCount2);
    });

    expect(fetchCount1).toBe(2);
    expect(fetchCount2).toBe(2);
  });
});
