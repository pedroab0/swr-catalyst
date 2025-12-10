import useSWR from "swr";
import { describe, expect, it } from "vitest";
import { act, waitFor } from "@testing-library/react";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { mutateById, resetCache } from "@/utils";

import { fetchTodos, renderHookWithGlobalCache, uniqueKeyId } from "../helpers";

describe("resetCache - Integration Tests", () => {
  it("should clear all cache entries (set to undefined)", async () => {
    const keyId1 = uniqueKeyId("reset-todos");
    const keyId2 = uniqueKeyId("reset-settings");

    const todosKey: SWRKey<Todo> = {
      id: keyId1,
      data: { id: 1, completed: false, title: "" },
    };

    const settingsKey: SWRKey<Todo> = {
      id: keyId2,
      data: { id: 2, completed: false, title: "" },
    };

    const { result } = renderHookWithGlobalCache(() => {
      const todos = useSWR(todosKey, fetchTodos, {
        revalidateOnMount: true,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const settings = useSWR(settingsKey, fetchTodos, {
        revalidateOnMount: true,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      return { todos, settings };
    });

    await waitFor(() => {
      expect(result.current.todos.data).toBeDefined();
      expect(result.current.settings.data).toBeDefined();
    });

    expect(result.current.todos.data?.[0].title).toBe("Test Todo 1");
    expect(result.current.settings.data?.[0].title).toBe("Test Todo 1");

    await act(async () => {
      await resetCache();
    });

    await waitFor(() => {
      expect(result.current.todos.data).toBeUndefined();
      expect(result.current.settings.data).toBeUndefined();
    });
  });

  it("should preserve specific cache entries by ID", async () => {
    const preserveKeyId = uniqueKeyId("preserve-todos");
    const clearKeyId = uniqueKeyId("clear-settings");

    const todosKey: SWRKey<Todo> = {
      id: preserveKeyId,
      data: { id: 1, completed: false, title: "" },
    };

    const settingsKey: SWRKey<Todo> = {
      id: clearKeyId,
      data: { id: 2, completed: false, title: "" },
    };

    const { result } = renderHookWithGlobalCache(() => {
      const todos = useSWR(todosKey, fetchTodos, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const settings = useSWR(settingsKey, fetchTodos, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      return { todos, settings };
    });

    await waitFor(() => {
      expect(result.current.todos.data).toBeDefined();
      expect(result.current.settings.data).toBeDefined();
    });

    const modifiedData: Todo[] = [
      { id: 888, title: "Modified Preserved", completed: true },
    ];

    await act(async () => {
      await mutateById(preserveKeyId, modifiedData, { revalidate: false });
    });

    await waitFor(() => {
      expect(result.current.todos.data?.[0].id).toBe(888);
    });

    await act(async () => {
      await resetCache(preserveKeyId);
    });

    expect(result.current.todos.data?.[0].id).toBe(888);
    expect(result.current.todos.data?.[0].title).toBe("Modified Preserved");

    await waitFor(() => {
      expect(result.current.settings.data).toBeUndefined();
    });
  });

  it("should preserve multiple cache entries by IDs", async () => {
    const keyId1 = uniqueKeyId("preserve-1");
    const keyId2 = uniqueKeyId("preserve-2");
    const keyId3 = uniqueKeyId("clear-me");

    const key1: SWRKey<Todo> = {
      id: keyId1,
      data: { id: 1, completed: false, title: "" },
    };

    const key2: SWRKey<Todo> = {
      id: keyId2,
      data: { id: 2, completed: false, title: "" },
    };

    const key3: SWRKey<Todo> = {
      id: keyId3,
      data: { id: 3, completed: false, title: "" },
    };

    const { result } = renderHookWithGlobalCache(() => {
      const swr1 = useSWR(key1, fetchTodos, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });
      const swr2 = useSWR(key2, fetchTodos, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });
      const swr3 = useSWR(key3, fetchTodos, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      return { swr1, swr2, swr3 };
    });

    await waitFor(() => {
      expect(result.current.swr1.data).toBeDefined();
      expect(result.current.swr2.data).toBeDefined();
      expect(result.current.swr3.data).toBeDefined();
    });

    await act(async () => {
      await mutateById(
        keyId1,
        [{ id: 111, title: "Preserved 1", completed: false }],
        { revalidate: false }
      );
      await mutateById(
        keyId2,
        [{ id: 222, title: "Preserved 2", completed: false }],
        { revalidate: false }
      );
    });

    await waitFor(() => {
      expect(result.current.swr1.data?.[0].id).toBe(111);
      expect(result.current.swr2.data?.[0].id).toBe(222);
    });

    await act(async () => {
      await resetCache([keyId1, keyId2]);
    });

    expect(result.current.swr1.data?.[0].id).toBe(111);
    expect(result.current.swr1.data?.[0].title).toBe("Preserved 1");
    expect(result.current.swr2.data?.[0].id).toBe(222);
    expect(result.current.swr2.data?.[0].title).toBe("Preserved 2");

    await waitFor(() => {
      expect(result.current.swr3.data).toBeUndefined();
    });
  });
});
