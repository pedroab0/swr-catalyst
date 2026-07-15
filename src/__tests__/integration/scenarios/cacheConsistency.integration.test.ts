import { act, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import {
  createTodo,
  fetchTodos,
  renderHookWithSWR,
  updateTodo,
} from "../helpers";

import { useSWRCreate, useSWRUpdate } from "@/hooks";

describe("Cache Consistency Scenarios - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    data: { completed: false, id: 1, title: "" },
    id: "todos",
  };

  const updateTodoWrapper = (
    id: string | number,
    data: Partial<{ title: string; completed: boolean }>
  ) => updateTodo(Number(id), data);

  describe("Cache Updates Propagation", () => {
    it("should propagate updates to all hooks using same key", async () => {
      const { result } = renderHookWithSWR(() => {
        const swr1 = useSWR(todosKey, fetchTodos);
        const swr2 = useSWR(todosKey, fetchTodos);
        const create = useSWRCreate(todosKey, createTodo);

        return { create, swr1, swr2 };
      });

      await waitFor(() => {
        expect(result.current.swr1.data).toBeDefined();
        expect(result.current.swr2.data).toBeDefined();
      });

      expect(result.current.swr1.data).toEqual(result.current.swr2.data);

      const initialLength = result.current.swr1.data?.length ?? 0;

      await act(async () => {
        await result.current.create.trigger({
          completed: false,
          id: 1,
          title: "Propagation Test",
        });
      });

      await waitFor(() => {
        expect(result.current.swr1.data?.length).toBe(initialLength + 1);
        expect(result.current.swr2.data?.length).toBe(initialLength + 1);
      });

      expect(result.current.swr1.data).toEqual(result.current.swr2.data);
    });

    it("should maintain consistency across create and update operations", async () => {
      const { result } = renderHookWithSWR(() => {
        const swr = useSWR(todosKey, fetchTodos);
        const create = useSWRCreate(todosKey, createTodo);
        const update = useSWRUpdate(todosKey, updateTodoWrapper);

        return { create, swr, update };
      });

      await waitFor(() => expect(result.current.swr.data).toBeDefined());

      await act(async () => {
        await result.current.create.trigger({
          completed: false,
          id: 1,
          title: "New Todo",
        });
      });

      await waitFor(() => {
        const newTodo = result.current.swr.data?.find(
          (t: Todo) => t.title === "New Todo"
        );

        expect(newTodo).toBeDefined();
      });

      const existingTodo = result.current.swr.data?.[0];

      await act(async () => {
        await result.current.update.trigger(existingTodo?.id as number, {
          title: "Updated Title",
        });
      });

      await waitFor(() => {
        const updated = result.current.swr.data?.find(
          (t: Todo) => t.id === existingTodo?.id
        );

        expect(updated?.title).toBe("Updated Title");
      });

      expect(result.current.create.error).toBeNull();
      expect(result.current.update.error).toBeNull();
    });
  });

  describe("Revalidation Behavior", () => {
    it("should revalidate after mutation completes", async () => {
      let fetchCount = 0;

      const countingFetcher = () => {
        fetchCount += 1;

        return fetchTodos();
      };

      const { result } = renderHookWithSWR(() => {
        const swr = useSWR(todosKey, countingFetcher);
        const create = useSWRCreate(todosKey, createTodo);

        return { create, swr };
      });

      await waitFor(() => expect(result.current.swr.data).toBeDefined());

      const initialFetchCount = fetchCount;

      await act(async () => {
        await result.current.create.trigger({
          completed: false,
          id: 1,
          title: "Revalidation Test",
        });
      });

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialFetchCount);
      });
    });

    it("should handle manual revalidation correctly", async () => {
      const { result } = renderHookWithSWR(() => useSWR(todosKey, fetchTodos));

      await waitFor(() => expect(result.current.data).toBeDefined());

      const dataBefore = result.current.data;

      await act(async () => {
        await result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.length).toBe(dataBefore?.length);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("Stale Data Handling", () => {
    it("should show stale data while revalidating", async () => {
      let isSlowFetch = false;

      const variableSpeedFetcher = async () => {
        // biome-ignore lint/suspicious/noUnnecessaryConditions: modified dynamically in test
        if (isSlowFetch) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return fetchTodos();
      };

      const { result } = renderHookWithSWR(() =>
        useSWR(todosKey, variableSpeedFetcher)
      );

      await waitFor(() => expect(result.current.data).toBeDefined());

      const staleData = result.current.data;

      isSlowFetch = true;

      await act(async () => {
        await result.current.mutate();
      });

      expect(result.current.data).toEqual(staleData);

      await waitFor(
        () => {
          expect(result.current.isValidating).toBe(false);
        },
        { timeout: 500 }
      );

      expect(result.current.data).toBeDefined();
    });
  });

  describe("Cache Isolation", () => {
    it("should isolate cache between different keys", async () => {
      const todosKey1: SWRKey<Todo> = {
        data: { completed: false, id: 1, title: "" },
        id: "todos-isolated-1",
      };

      const todosKey2: SWRKey<Todo> = {
        data: { completed: false, id: 2, title: "" },
        id: "todos-isolated-2",
      };

      const { result } = renderHookWithSWR(() => {
        const swr1 = useSWR(todosKey1, fetchTodos);
        const swr2 = useSWR(todosKey2, fetchTodos);
        const create1 = useSWRCreate(todosKey1, createTodo);

        return { create1, swr1, swr2 };
      });

      await waitFor(() => {
        expect(result.current.swr1.data).toBeDefined();
        expect(result.current.swr2.data).toBeDefined();
      });

      const swr2LengthBefore = result.current.swr2.data?.length;

      await act(async () => {
        await result.current.create1.trigger({
          completed: false,
          id: 1,
          title: "Isolated Create",
        });
      });

      expect(result.current.swr2.data?.length).toBe(swr2LengthBefore);
    });
  });

  describe("Error Recovery and Cache", () => {
    it("should preserve cache on mutation error", async () => {
      const failingCreate = (_data: Todo): Promise<Todo> => {
        throw new Error("Create failed");
      };

      const { result } = renderHookWithSWR(() => {
        const swr = useSWR(todosKey, fetchTodos);
        const create = useSWRCreate(todosKey, failingCreate);

        return { create, swr };
      });

      await waitFor(() => expect(result.current.swr.data).toBeDefined());

      const dataBefore = result.current.swr.data;

      await act(async () => {
        try {
          await result.current.create.trigger({
            completed: false,
            id: 1,
            title: "Will Fail",
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.swr.data).toEqual(dataBefore);
      expect(result.current.create.error).toBeDefined();
    });
  });
});
