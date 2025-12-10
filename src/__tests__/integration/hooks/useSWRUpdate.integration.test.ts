import useSWR from "swr";
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { fetchTodos, renderHookWithSWR, updateTodo } from "../helpers";

import { useSWRUpdate } from "@/hooks";

describe("useSWRUpdate - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    id: "todos",
    data: { id: 1, completed: false, title: "" },
  };

  const updateTodoWrapper = (
    id: string | number,
    data: Partial<{ title: string; completed: boolean }>
  ) => updateTodo(Number(id), data);

  it("should update existing item in real SWR cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const update = useSWRUpdate(todosKey, updateTodoWrapper);

      return { swr, update };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];
    expect(initialData.length).toBeGreaterThan(0);

    const todoToUpdate = initialData[0];
    const newTitle = "Updated Title via Integration Test";

    await act(async () => {
      await result.current.update.trigger(todoToUpdate.id, {
        title: newTitle,
      });
    });

    expect(result.current.update.isMutating).toBe(false);
    expect(result.current.update.error).toBeNull();

    await waitFor(() => {
      const updatedTodo = result.current.swr.data?.find(
        (t: Todo) => t.id === todoToUpdate.id
      );
      expect(updatedTodo?.title).toBe(newTitle);
    });
  });

  it("should handle optimistic updates with server sync", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const update = useSWRUpdate(todosKey, updateTodoWrapper, {
        optimisticUpdate: (
          current: Todo[] | undefined,
          { id, data }: { id: string | number; data: Partial<Todo> }
        ) => (current || []).map((t) => (t.id === id ? { ...t, ...data } : t)),
      });

      return { swr, update };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];
    const todoToUpdate = initialData[0];
    const originalCompleted = todoToUpdate.completed;

    await act(async () => {
      await result.current.update.trigger(todoToUpdate.id, {
        completed: !originalCompleted,
      });
    });

    await waitFor(() => {
      const updatedTodo = result.current.swr.data?.find(
        (t: Todo) => t.id === todoToUpdate.id
      );
      expect(updatedTodo?.completed).toBe(!originalCompleted);
    });

    expect(result.current.update.error).toBeNull();
  });

  it("should set isMutating state correctly during update", async () => {
    const slowUpdate = async (
      id: string | number,
      data: Partial<{ title: string; completed: boolean }>
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return updateTodo(Number(id), data);
    };

    const { result } = renderHookWithSWR(() =>
      useSWRUpdate(todosKey, slowUpdate)
    );

    expect(result.current.isMutating).toBe(false);

    const updatePromise = result.current.trigger(1, {
      title: "Slow Update Test",
    });

    await waitFor(() => expect(result.current.isMutating).toBe(true), {
      timeout: 300,
    });

    await act(async () => {
      await updatePromise;
    });

    expect(result.current.isMutating).toBe(false);
  });

  it("should handle errors with real SWR", async () => {
    const failingUpdate = (
      _id: string | number,
      _data: Partial<{ title: string; completed: boolean }>
    ): Promise<Todo> => {
      throw new Error("Update failed");
    };

    const { result } = renderHookWithSWR(() =>
      useSWRUpdate(todosKey, failingUpdate)
    );

    await act(async () => {
      try {
        await result.current.trigger(1, { title: "Will Fail" });
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain("Update failed");
    expect(result.current.isMutating).toBe(false);
  });

  it("should handle multiple sequential updates to same item", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const update = useSWRUpdate(todosKey, updateTodoWrapper);

      return { swr, update };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const todoToUpdate = result.current.swr.data?.[0];
    expect(todoToUpdate).toBeDefined();

    await act(async () => {
      await result.current.update.trigger(todoToUpdate!.id, {
        title: "First Update",
      });
    });

    await waitFor(() => {
      const updated = result.current.swr.data?.find(
        (t: Todo) => t.id === todoToUpdate!.id
      );
      expect(updated?.title).toBe("First Update");
    });

    await act(async () => {
      await result.current.update.trigger(todoToUpdate!.id, {
        completed: true,
      });
    });

    await waitFor(() => {
      const updated = result.current.swr.data?.find(
        (t: Todo) => t.id === todoToUpdate!.id
      );
      expect(updated?.title).toBe("First Update");
      expect(updated?.completed).toBe(true);
    });

    await act(async () => {
      await result.current.update.trigger(todoToUpdate!.id, {
        title: "Final Update",
        completed: false,
      });
    });

    await waitFor(() => {
      const updated = result.current.swr.data?.find(
        (t: Todo) => t.id === todoToUpdate!.id
      );
      expect(updated?.title).toBe("Final Update");
      expect(updated?.completed).toBe(false);
    });

    expect(result.current.update.error).toBeNull();
  });
});
