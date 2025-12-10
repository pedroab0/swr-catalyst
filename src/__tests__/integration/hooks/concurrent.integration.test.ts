import { act, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import {
  createTodo,
  deleteTodo,
  fetchTodos,
  renderHookWithSWR,
  updateTodo,
} from "../helpers";

import { useSWRCreate, useSWRDelete, useSWRUpdate } from "@/hooks";

describe("Concurrent Scenarios - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    id: "todos",
    data: { id: 1, completed: false, title: "" },
  };

  const updateTodoWrapper = (
    id: string | number,
    data: Partial<{ title: string; completed: boolean }>
  ) => updateTodo(Number(id), data);

  const deleteTodoWrapper = (id: string | number) => deleteTodo(Number(id));

  /** Finds a todo by title in the data array */
  const findTodoByTitle = (data: Todo[] | undefined, title: string) =>
    data?.find((t: Todo) => t.title === title);

  /** Finds a todo by id in the data array */
  const findTodoById = (data: Todo[] | undefined, id: number) =>
    data?.find((t: Todo) => t.id === id);

  /** Creates a todo and waits for it to appear in the cache */
  async function createAndWaitForTodo(
    result: {
      current: {
        swr: { data?: Todo[] };
        create: { trigger: (data: Todo) => Promise<unknown> };
      };
    },
    todoData: Todo,
    expectedLength: number
  ) {
    await act(async () => {
      await result.current.create.trigger(todoData);
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(expectedLength);
    });

    return findTodoByTitle(result.current.swr.data, todoData.title);
  }

  /** Asserts that a todo has the expected properties */
  function assertTodoProperties(
    todo: Todo | undefined,
    expected: { title?: string; completed?: boolean }
  ) {
    if (expected.title !== undefined) {
      expect(todo?.title).toBe(expected.title);
    }
    if (expected.completed !== undefined) {
      expect(todo?.completed).toBe(expected.completed);
    }
  }

  it("should handle multiple hooks using same cache key", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr1 = useSWR(todosKey, fetchTodos);
      const swr2 = useSWR(todosKey, fetchTodos);
      const create = useSWRCreate(todosKey, createTodo);

      return { swr1, swr2, create };
    });

    await waitFor(() => {
      expect(result.current.swr1.data).toBeDefined();
      expect(result.current.swr2.data).toBeDefined();
    });

    expect(result.current.swr1.data).toEqual(result.current.swr2.data);

    const initialLength = result.current.swr1.data?.length ?? 0;

    await act(async () => {
      await result.current.create.trigger({
        id: 1,
        title: "Shared Cache Test",
        completed: false,
      });
    });

    await waitFor(() => {
      expect(result.current.swr1.data?.length).toBe(initialLength + 1);
      expect(result.current.swr2.data?.length).toBe(initialLength + 1);
    });

    expect(result.current.swr1.data).toEqual(result.current.swr2.data);
  });

  it("should handle create and update on same cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const create = useSWRCreate(todosKey, createTodo);
      const update = useSWRUpdate(todosKey, updateTodoWrapper);

      return { swr, create, update };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialLength = result.current.swr.data?.length ?? 0;
    const todoData = { id: 1, title: "New Todo for Update", completed: false };

    const createdTodo = await createAndWaitForTodo(
      result,
      todoData,
      initialLength + 1
    );
    expect(createdTodo).toBeDefined();

    await act(async () => {
      await result.current.update.trigger(createdTodo?.id as number, {
        title: "Updated Todo",
        completed: true,
      });
    });

    await waitFor(() => {
      const updatedTodo = findTodoById(
        result.current.swr.data,
        createdTodo?.id as number
      );
      assertTodoProperties(updatedTodo, {
        title: "Updated Todo",
        completed: true,
      });
    });
  });

  it("should handle create and delete on same cache", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const create = useSWRCreate(todosKey, createTodo);
      const del = useSWRDelete(todosKey, deleteTodoWrapper);

      return { swr, create, del };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialLength = result.current.swr.data?.length ?? 0;
    const todoData = { id: 1, title: "Todo to Delete", completed: false };

    const createdTodo = await createAndWaitForTodo(
      result,
      todoData,
      initialLength + 1
    );
    expect(createdTodo).toBeDefined();

    await act(async () => {
      await result.current.del.trigger(createdTodo?.id as number);
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialLength);
      expect(
        findTodoById(result.current.swr.data, createdTodo?.id as number)
      ).toBeUndefined();
    });
  });

  it("should handle all CRUD operations sequentially", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const create = useSWRCreate(todosKey, createTodo);
      const update = useSWRUpdate(todosKey, updateTodoWrapper);
      const del = useSWRDelete(todosKey, deleteTodoWrapper);

      return { swr, create, update, del };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialLength = result.current.swr.data?.length ?? 0;
    const todoData = { id: 1, title: "CRUD Test Todo", completed: false };

    const createdTodo = await createAndWaitForTodo(
      result,
      todoData,
      initialLength + 1
    );
    expect(createdTodo).toBeDefined();

    await act(async () => {
      await result.current.update.trigger(createdTodo?.id as number, {
        title: "Updated CRUD Todo",
        completed: true,
      });
    });

    await waitFor(() => {
      const updated = findTodoById(
        result.current.swr.data,
        createdTodo?.id as number
      );
      assertTodoProperties(updated, {
        title: "Updated CRUD Todo",
        completed: true,
      });
    });

    await act(async () => {
      await result.current.del.trigger(createdTodo?.id as number);
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialLength);
      expect(
        findTodoById(result.current.swr.data, createdTodo?.id as number)
      ).toBeUndefined();
    });

    expect(result.current.create.error).toBeNull();
    expect(result.current.update.error).toBeNull();
    expect(result.current.del.error).toBeNull();
  });

  it("should maintain cache consistency after revalidation", async () => {
    const { result } = renderHookWithSWR(() => {
      const swr = useSWR(todosKey, fetchTodos);
      const create = useSWRCreate(todosKey, createTodo);

      return { swr, create };
    });

    await waitFor(() => expect(result.current.swr.data).toBeDefined());

    const initialData = result.current.swr.data ?? [];

    await act(async () => {
      await result.current.create.trigger({
        id: 1,
        title: "Consistency Test 1",
        completed: false,
      });
    });

    await act(async () => {
      await result.current.create.trigger({
        id: 2,
        title: "Consistency Test 2",
        completed: true,
      });
    });

    await waitFor(() => {
      expect(result.current.swr.data?.length).toBe(initialData.length + 2);
    });

    await act(async () => {
      await result.current.swr.mutate();
    });

    await waitFor(() => {
      const todo1 = result.current.swr.data?.find(
        (t: Todo) => t.title === "Consistency Test 1"
      );
      const todo2 = result.current.swr.data?.find(
        (t: Todo) => t.title === "Consistency Test 2"
      );
      expect(todo1).toBeDefined();
      expect(todo2).toBeDefined();
    });
  });
});
