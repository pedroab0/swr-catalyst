import useSWR from "swr";
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { useSWRCreate } from "@/hooks";

import { createTodo, fetchTodos, renderHookWithSWR } from "../helpers";

describe("useSWRCreate - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    id: "todos",
    data: { id: 1, completed: false, title: "" },
  };

  it("should create item and update real SWR cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const create = useSWRCreate(todosKey, createTodo);

      return { swr, create };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialCount = result.current.swr.data?.length ?? 0;

    expect(initialCount).toBeGreaterThan(0);

    await act(async () => {
      await result.current.create.trigger({
        id: 1,
        title: "New Integration Test Todo",
        completed: false,
      });
    });

    expect(result.current.create.isMutating).toBe(false);
    expect(result.current.create.error).toBeNull();

    await waitFor(
      () => {
        expect(result.current.swr.data?.length).toBe(initialCount + 1);
      },
      { timeout: 2000 }
    );

    const newTodo = result.current.swr.data?.find(
      (t: Todo) => t.title === "New Integration Test Todo"
    );

    expect(newTodo).toBeDefined();

    expect(newTodo?.completed).toBe(false);
  });

  it("should handle optimistic updates with real SWR", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const create = useSWRCreate(todosKey, createTodo, {
        optimisticUpdate: (current: Todo[] | undefined, newTodo: Todo) => [
          ...(current || []),
          {
            id: Date.now(),
            title: newTodo.title,
            completed: newTodo.completed,
          },
        ],
      });

      return { swr, create };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];

    await act(async () => {
      await result.current.create.trigger({
        id: 1,
        title: "Optimistic Todo",
        completed: false,
      });
    });

    await waitFor(() => {
      const optimisticTodo = result.current.swr.data?.find(
        (t: Todo) => t.title === "Optimistic Todo"
      );

      expect(optimisticTodo).toBeDefined();

      expect(optimisticTodo?.id).not.toBe(1);

      expect(result.current.swr.data?.length).toBe(initialData.length + 1);
    });
  });

  it("should set isMutating state correctly", async () => {
    const slowCreate = async (data: Todo) => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      return createTodo(data);
    };

    const { result } = renderHookWithSWR(() =>
      useSWRCreate(todosKey, slowCreate)
    );

    expect(result.current.isMutating).toBe(false);

    const createPromise = result.current.trigger({
      id: 1,
      title: "Test Todo",
      completed: false,
    });

    await waitFor(() => expect(result.current.isMutating).toBe(true), {
      timeout: 200,
    });

    await act(async () => {
      await createPromise;
    });

    expect(result.current.isMutating).toBe(false);
  });

  it("should handle errors with real SWR", async () => {
    const { result } = renderHookWithSWR(() =>
      useSWRCreate(
        todosKey,
        (_data: { title: string; completed?: boolean }) => {
          throw new Error("Network error");
        }
      )
    );

    await act(async () => {
      try {
        await result.current.trigger({
          id: 1,
          title: "Will Fail",
          completed: false,
        });
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();

    expect(result.current.error?.message).toContain("Network error");

    expect(result.current.isMutating).toBe(false);
  });

  it("should handle multiple creates updating same cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const create = useSWRCreate(todosKey, createTodo);

      return { swr, create };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialCount = result.current.swr.data?.length ?? 0;

    await act(async () => {
      await result.current.create.trigger({
        id: 1,
        title: "First Todo",
        completed: false,
      });
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialCount + 1);
    });

    await act(async () => {
      await result.current.create.trigger({
        id: 2,
        title: "Second Todo",
        completed: true,
      });
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialCount + 2);
    });

    const firstTodo = result.current.swr.data?.find(
      (t: Todo) => t.title === "First Todo"
    );
    const secondTodo = result.current.swr.data?.find(
      (t: Todo) => t.title === "Second Todo"
    );

    expect(firstTodo).toBeDefined();
    expect(firstTodo?.completed).toBe(false);

    expect(secondTodo).toBeDefined();
    expect(secondTodo?.completed).toBe(true);
  });

  it("should create with existing SWR data already in cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);

      const create = useSWRCreate(todosKey, createTodo);

      return { swr, create };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialTodos = result.current.swr.data ?? [];
    expect(initialTodos.length).toBeGreaterThan(0);

    expect(result.current.swr.data).toEqual(initialTodos);

    await act(async () => {
      await result.current.create.trigger({
        id: 999,
        title: "New Todo with Pre-populated Cache",
        completed: false,
      });
    });

    expect(result.current.create.error).toBeNull();
    expect(result.current.create.isMutating).toBe(false);

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialTodos.length + 1);
    });

    const newTodo = result.current.swr.data?.find(
      (t: Todo) => t.title === "New Todo with Pre-populated Cache"
    );

    expect(newTodo).toBeDefined();
    expect(newTodo?.id).toBeDefined();
  });
});
