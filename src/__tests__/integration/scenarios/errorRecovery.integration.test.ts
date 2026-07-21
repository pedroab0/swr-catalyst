import { act, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import useSWR from "swr";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { MutationError } from "@/errors";
import {
  ApiError,
  createTodo,
  deleteTodo,
  fetchTodos,
  renderHookWithSWR,
  updateTodo,
} from "../helpers";

import { useSWRCreate, useSWRDelete, useSWRUpdate } from "@/hooks";

import { server } from "../setup/server";

/**
 * Creates a counting fetcher that tracks how many times it's called.
 * Useful for testing revalidation behavior.
 */
function createCountingFetcher() {
  let fetchCount = 0;

  const fetcher = () => {
    fetchCount += 1;
    return fetchTodos();
  };

  const getCount = () => fetchCount;

  return { fetcher, getCount };
}

/**
 * Creates a mock server handler for validation/API errors.
 */
function mockApiError(
  method: "post" | "patch" | "delete",
  path: string,
  errorPayload: {
    error: string;
    code: string;
    details?: Record<string, string>;
  },
  status: number
) {
  const handlers = {
    delete: http.delete,
    patch: http.patch,
    post: http.post,
  };

  server.use(
    handlers[method](path, () => HttpResponse.json(errorPayload, { status }))
  );
}

/**
 * Asserts that an error is a MutationError wrapping an ApiError with expected properties.
 */
function assertApiError(
  error: unknown,
  expectedStatus: number,
  expectedCode: string,
  checks?: { isValidationError?: boolean; isNotFound?: boolean }
) {
  expect(error).toBeInstanceOf(MutationError);

  const mutationError = error as MutationError;
  expect(mutationError.originalError).toBeInstanceOf(ApiError);

  const apiError = mutationError.originalError as ApiError;
  expect(apiError.status).toBe(expectedStatus);
  expect(apiError.code).toBe(expectedCode);

  if (checks?.isValidationError !== undefined) {
    expect(apiError.isValidationError()).toBe(checks.isValidationError);
  }
  if (checks?.isNotFound !== undefined) {
    expect(apiError.isNotFound()).toBe(checks.isNotFound);
  }

  return apiError;
}

describe("Error Recovery Scenarios - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    data: { completed: false, id: 1, title: "" },
    id: "todos",
  };

  describe("Network Errors", () => {
    it("should handle network error and recover on retry", async () => {
      let shouldFail = true;

      const unreliableFetcher = async () => {
        // biome-ignore lint/suspicious/noUnnecessaryConditions: modified dynamically in test
        if (shouldFail) {
          throw new Error("Network error");
        }

        return await fetchTodos();
      };

      const { result } = renderHookWithSWR(() =>
        useSWR(todosKey, unreliableFetcher, {
          shouldRetryOnError: false,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toBe("Network error");
      expect(result.current.data).toBeUndefined();

      shouldFail = false;

      await act(async () => {
        await result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.error).toBeUndefined();
      expect(result.current.data?.length).toBeGreaterThan(0);
    });

    it("should clear error state after successful mutation", async () => {
      const failingCreate = (_data: Todo): Promise<Todo> => {
        throw new Error("Create failed");
      };

      const { result } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, failingCreate)
      );

      await act(async () => {
        try {
          await result.current.trigger({
            completed: false,
            id: 1,
            title: "Test",
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Create failed");

      const { result: workingResult } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, createTodo)
      );

      await act(async () => {
        await workingResult.current.trigger({
          completed: false,
          id: 1,
          title: "Success",
        });
      });

      expect(workingResult.current.error).toBeNull();
    });
  });

  describe("Optimistic Rollback", () => {
    it("should rollback optimistic update on error", async () => {
      const failingUpdate = async (
        _id: string | number,
        _data: Partial<Todo>
      ): Promise<Todo> => {
        await new Promise((resolve) => setTimeout(resolve, 50));

        throw new Error("Update failed");
      };

      const { result } = renderHookWithSWR(() => {
        const swr = useSWR(todosKey, fetchTodos);

        const update = useSWRUpdate(todosKey, failingUpdate, {
          optimisticUpdate: (currentData, { id, data }) => {
            if (!currentData) {
              return currentData;
            }

            return (currentData as Todo[]).map((todo) =>
              todo.id === id ? { ...todo, ...data } : todo
            );
          },

          rollbackOnError: true,
        });

        return { swr, update };
      });

      await waitFor(() => expect(result.current.swr.data).toBeDefined());

      const originalData = result.current.swr.data;
      const todoToUpdate = originalData?.[0];
      const originalTitle = todoToUpdate?.title;

      expect(todoToUpdate).toBeDefined();
      expect(originalTitle).toBeDefined();

      await act(async () => {
        try {
          await result.current.update.trigger(todoToUpdate?.id as number, {
            title: "Optimistic Title",
          });
        } catch {
          // Expected to fail
        }
      });

      await waitFor(() => {
        expect(result.current.update.error).toBeDefined();
      });

      expect(result.current.update.error?.message).toContain("Update failed");
      expect(result.current.update.isMutating).toBe(false);
    });
  });

  describe("Error State Management", () => {
    it("should persist error state until cleared", async () => {
      const failingCreate = (_data: Todo): Promise<Todo> => {
        throw new Error("Persistent error");
      };

      const { result } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, failingCreate)
      );

      expect(result.current.error).toBeNull();

      await act(async () => {
        try {
          await result.current.trigger({
            completed: false,
            id: 1,
            title: "Test",
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isMutating).toBe(false);

      expect(result.current.error?.message).toContain("Persistent error");
    });

    it("should handle multiple consecutive errors", async () => {
      let errorCount = 0;

      const countingFailCreate = (_data: Todo): Promise<Todo> => {
        errorCount += 1;

        throw new Error(`Error #${errorCount}`);
      };

      const { result } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, countingFailCreate)
      );

      await act(async () => {
        try {
          await result.current.trigger({
            completed: false,
            id: 1,
            title: "Test 1",
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error?.message).toContain("Error #1");

      await act(async () => {
        try {
          await result.current.trigger({
            completed: false,
            id: 2,
            title: "Test 2",
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error?.message).toContain("Error #2");
      expect(errorCount).toBe(2);
    });
  });

  describe("Partial Failures", () => {
    it("should handle partial success in sequential operations", async () => {
      let callCount = 0;

      const sometimesFailingCreate = (data: Todo): Promise<Todo> => {
        callCount += 1;

        if (callCount === 2) {
          throw new Error("Second call failed");
        }

        return createTodo(data);
      };

      const { result } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, sometimesFailingCreate)
      );

      await act(async () => {
        await result.current.trigger({
          completed: false,
          id: 1,
          title: "First Todo",
        });
      });

      expect(result.current.error).toBeNull();

      await act(async () => {
        try {
          await result.current.trigger({
            completed: false,
            id: 2,
            title: "Second Todo",
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();

      await act(async () => {
        await result.current.trigger({
          completed: false,
          id: 3,
          title: "Third Todo",
        });
      });

      expect(result.current.error).toBeNull();
      expect(callCount).toBe(3);
    });
  });

  describe("Server Validation Errors (400/422)", () => {
    it("should handle 400 Bad Request with validation details", async () => {
      const errorDetails = {
        completed: "Must be a boolean",
        title: "Title is required",
      };

      mockApiError(
        "post",
        "/api/todos",
        {
          code: "VALIDATION_ERROR",
          details: errorDetails,
          error: "Validation failed",
        },
        400
      );

      const { result } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, createTodo)
      );

      await act(async () => {
        try {
          await result.current.trigger({ completed: false, id: 1, title: "" });
        } catch (error) {
          const apiError = assertApiError(error, 400, "VALIDATION_ERROR", {
            isValidationError: true,
          });
          expect(apiError.details).toEqual(errorDetails);
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle 422 Unprocessable Entity", async () => {
      mockApiError(
        "patch",
        "/api/todos/:id",
        {
          code: "UNPROCESSABLE_ENTITY",
          details: { title: "Title must be at least 3 characters" },
          error: "Entity cannot be processed",
        },
        422
      );

      const { result } = renderHookWithSWR(() =>
        useSWRUpdate(todosKey, updateTodo)
      );

      await act(async () => {
        try {
          await result.current.trigger(1, { title: "ab" });
        } catch (error) {
          assertApiError(error, 422, "UNPROCESSABLE_ENTITY", {
            isValidationError: true,
          });
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it("should distinguish validation errors from network errors", async () => {
      mockApiError(
        "post",
        "/api/todos",
        { code: "VALIDATION_ERROR", error: "Validation failed" },
        400
      );

      const { result: validationResult } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, createTodo)
      );

      let caughtError: MutationError | undefined;

      await act(async () => {
        try {
          await validationResult.current.trigger({
            completed: false,
            id: 1,
            title: "",
          });
        } catch (error) {
          caughtError = error as MutationError;
        }
      });

      expect(caughtError).toBeDefined();

      assertApiError(caughtError, 400, "VALIDATION_ERROR", {
        isNotFound: false,
        isValidationError: true,
      });

      const networkFailingCreate = (_data: Todo): Promise<Todo> => {
        const error = new Error("Network request failed");

        error.name = "NetworkError";

        throw error;
      };

      const { result: networkResult } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, networkFailingCreate)
      );

      await act(async () => {
        try {
          await networkResult.current.trigger({
            completed: false,
            id: 1,
            title: "Test",
          });
        } catch {
          // Expected
        }
      });

      expect(networkResult.current.error).toBeDefined();
      expect(networkResult.current.error).toBeInstanceOf(MutationError);
      expect(
        (networkResult.current.error as MutationError).originalError
      ).not.toBeInstanceOf(ApiError);
    });

    it("should handle 404 Not Found on delete", async () => {
      mockApiError(
        "delete",
        "/api/todos/:id",
        { code: "NOT_FOUND", error: "Todo not found" },
        404
      );

      const { result } = renderHookWithSWR(() =>
        useSWRDelete(todosKey, deleteTodo)
      );

      await act(async () => {
        try {
          await result.current.trigger(999);
        } catch (error) {
          assertApiError(error, 404, "NOT_FOUND", {
            isNotFound: true,
            isValidationError: false,
          });
        }
      });
    });
  });

  describe("Revalidation Timing", () => {
    const swrOptions = {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    };

    async function setupCountingHook() {
      const { fetcher, getCount } = createCountingFetcher();
      const { result } = renderHookWithSWR(() =>
        useSWR(todosKey, fetcher, swrOptions)
      );

      await waitFor(() => expect(result.current.data).toBeDefined());
      expect(getCount()).toBe(1);

      return { getCount, result };
    }

    it.each([
      {
        expectedFetchCount: 1,
        expectedTitle: "Local Update",
        mutateData: [
          { completed: true, id: 100, title: "Local Update" },
        ] as Todo[],
        name: "should skip network request when revalidate is false",
        revalidate: false,
      },
      {
        expectedFetchCount: 2,
        expectedTitle: "Test Todo 1",
        mutateData: [
          { completed: true, id: 100, title: "Will Be Overwritten" },
        ] as Todo[],
        name: "should trigger network request when revalidate is true",
        revalidate: true,
      },
      {
        expectedFetchCount: 2,
        expectedTitle: undefined,
        mutateData: undefined,
        name: "should default to revalidate when mutate is called without data",
        revalidate: undefined,
      },
    ])(
      "$name",
      async ({ mutateData, revalidate, expectedFetchCount, expectedTitle }) => {
        const { result, getCount } = await setupCountingHook();

        await act(async () => {
          await result.current.mutate(
            mutateData,
            revalidate === undefined ? undefined : { revalidate }
          );
        });

        await waitFor(() => expect(getCount()).toBe(expectedFetchCount));

        if (expectedTitle) {
          expect(result.current.data?.[0].title).toBe(expectedTitle);
        }
      }
    );

    it("should preserve local changes with revalidate: false on mutation hook", async () => {
      const { result } = renderHookWithSWR(() => {
        const swr = useSWR(todosKey, fetchTodos, {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        });

        const update = useSWRUpdate(todosKey, updateTodo, {
          optimisticUpdate: (currentData, { id, data }) => {
            if (!currentData) {
              return currentData;
            }

            return (currentData as Todo[]).map((todo) =>
              todo.id === id ? { ...todo, ...data } : todo
            );
          },
        });

        return { swr, update };
      });

      await waitFor(() => expect(result.current.swr.data).toBeDefined());

      const originalTitle = result.current.swr.data?.[0].title;

      expect(originalTitle).toBe("Test Todo 1");

      await act(async () => {
        await result.current.update.trigger(1, { title: "Updated Title" });
      });

      await waitFor(() => {
        expect(result.current.swr.data?.[0].title).toBe("Updated Title");
      });
    });
  });
});
