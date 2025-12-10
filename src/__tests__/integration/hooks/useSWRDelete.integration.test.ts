import useSWR from "swr";
import { describe, expect, it } from "vitest";
import { act, waitFor } from "@testing-library/react";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { deleteTodo, fetchTodos, renderHookWithSWR } from "../helpers";

import { useSWRDelete } from "@/hooks";

describe("useSWRDelete - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    id: "todos",
    data: { id: 1, completed: false, title: "" },
  };

  const deleteTodoWrapper = (id: string | number) => deleteTodo(Number(id));

  it("should delete item from real SWR cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const del = useSWRDelete(todosKey, deleteTodoWrapper);

      return { swr, del };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];
    expect(initialData.length).toBeGreaterThan(0);

    const todoToDelete = initialData[0];

    await act(async () => {
      await result.current.del.trigger(todoToDelete.id);
    });

    expect(result.current.del.isMutating).toBe(false);
    expect(result.current.del.error).toBeNull();

    await waitFor(() => {
      const deletedTodo = result.current.swr.data?.find(
        (t: Todo) => t.id === todoToDelete.id
      );
      expect(deletedTodo).toBeUndefined();
    });

    expect(result.current.swr.data?.length).toBe(initialData.length - 1);
  });

  it("should handle errors with real SWR", async () => {
    const failingDelete = (_id: string | number): Promise<unknown> => {
      throw new Error("Delete failed");
    };

    const { result } = renderHookWithSWR(() =>
      useSWRDelete(todosKey, failingDelete)
    );

    await act(async () => {
      try {
        await result.current.trigger(1);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain("Delete failed");
    expect(result.current.isMutating).toBe(false);
  });

  it("should handle delete non-existent item", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const del = useSWRDelete(todosKey, deleteTodoWrapper);

      return { swr, del };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];

    const nonExistentId = 99_999;

    await act(async () => {
      try {
        await result.current.del.trigger(nonExistentId);
      } catch {
        // May throw depending on MSW handler
      }
    });

    expect(result.current.swr.data?.length).toBe(initialData.length);
  });

  it("should set isMutating state correctly during delete", async () => {
    const slowDelete = async (id: string | number) => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      return deleteTodo(Number(id));
    };

    const { result } = renderHookWithSWR(() =>
      useSWRDelete(todosKey, slowDelete)
    );

    expect(result.current.isMutating).toBe(false);

    const deletePromise = result.current.trigger(1);

    await waitFor(() => expect(result.current.isMutating).toBe(true), {
      timeout: 300,
    });

    await act(async () => {
      await deletePromise;
    });

    expect(result.current.isMutating).toBe(false);
  });

  it("should handle multiple deletes in sequence", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const del = useSWRDelete(todosKey, deleteTodoWrapper);

      return { swr, del };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];
    expect(initialData.length).toBeGreaterThanOrEqual(2);

    const firstTodo = initialData[0];
    const secondTodo = initialData[1];

    await act(async () => {
      await result.current.del.trigger(firstTodo.id);
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialData.length - 1);

      const deleted = result.current.swr.data?.find(
        (t: Todo) => t.id === firstTodo.id
      );

      expect(deleted).toBeUndefined();
    });

    await act(async () => {
      await result.current.del.trigger(secondTodo.id);
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialData.length - 2);

      const deleted = result.current.swr.data?.find(
        (t: Todo) => t.id === secondTodo.id
      );

      expect(deleted).toBeUndefined();
    });

    expect(result.current.del.error).toBeNull();
  });
});
