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

describe("Error Recovery Scenarios - Integration Tests", () => {
  const todosKey: SWRKey<Todo> = {
    id: "todos",
    data: { id: 1, completed: false, title: "" },
  };

  describe("Network Errors", () => {
    it("should handle network error and recover on retry", async () => {
      let shouldFail = true;

      const unreliableFetcher = async () => {
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
            id: 1,
            title: "Test",
            completed: false,
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
          id: 1,
          title: "Success",
          completed: false,
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
            id: 1,
            title: "Test",
            completed: false,
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
            id: 1,
            title: "Test 1",
            completed: false,
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error?.message).toContain("Error #1");

      await act(async () => {
        try {
          await result.current.trigger({
            id: 2,
            title: "Test 2",
            completed: false,
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
          id: 1,
          title: "First Todo",
          completed: false,
        });
      });

      expect(result.current.error).toBeNull();

      await act(async () => {
        try {
          await result.current.trigger({
            id: 2,
            title: "Second Todo",
            completed: false,
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();

      await act(async () => {
        await result.current.trigger({
          id: 3,
          title: "Third Todo",
          completed: false,
        });
      });

      expect(result.current.error).toBeNull();
      expect(callCount).toBe(3);
    });
  });

  describe("Server Validation Errors (400/422)", () => {
    it("should handle 400 Bad Request with validation details", async () => {
      server.use(
        http.post("/api/todos", () =>
          HttpResponse.json(
            {
              error: "Validation failed",
              code: "VALIDATION_ERROR",
              details: {
                title: "Title is required",
                completed: "Must be a boolean",
              },
            },
            { status: 400 }
          )
        )
      );

      const { result } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, createTodo)
      );

      await act(async () => {
        try {
          await result.current.trigger({ id: 1, title: "", completed: false });
        } catch (error) {
          expect(error).toBeInstanceOf(MutationError);

          const mutationError = error as MutationError;

          expect(mutationError.originalError).toBeInstanceOf(ApiError);

          const apiError = mutationError.originalError as ApiError;

          expect(apiError.status).toBe(400);
          expect(apiError.code).toBe("VALIDATION_ERROR");
          expect(apiError.isValidationError()).toBe(true);
          expect(apiError.details).toEqual({
            title: "Title is required",
            completed: "Must be a boolean",
          });
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle 422 Unprocessable Entity", async () => {
      server.use(
        http.patch("/api/todos/:id", () =>
          HttpResponse.json(
            {
              error: "Entity cannot be processed",
              code: "UNPROCESSABLE_ENTITY",
              details: {
                title: "Title must be at least 3 characters",
              },
            },
            { status: 422 }
          )
        )
      );

      const { result } = renderHookWithSWR(() =>
        useSWRUpdate(todosKey, updateTodo)
      );

      await act(async () => {
        try {
          await result.current.trigger(1, { title: "ab" });
        } catch (error) {
          expect(error).toBeInstanceOf(MutationError);

          const mutationError = error as MutationError;

          expect(mutationError.originalError).toBeInstanceOf(ApiError);

          const apiError = mutationError.originalError as ApiError;

          expect(apiError.status).toBe(422);
          expect(apiError.code).toBe("UNPROCESSABLE_ENTITY");
          expect(apiError.isValidationError()).toBe(true);
        }
      });

      expect(result.current.error).toBeDefined();
    });

    it("should distinguish validation errors from network errors", async () => {
      server.use(
        http.post("/api/todos", () =>
          HttpResponse.json(
            { error: "Validation failed", code: "VALIDATION_ERROR" },
            { status: 400 }
          )
        )
      );

      const { result: validationResult } = renderHookWithSWR(() =>
        useSWRCreate(todosKey, createTodo)
      );

      let caughtError: MutationError | undefined;

      await act(async () => {
        try {
          await validationResult.current.trigger({
            id: 1,
            title: "",
            completed: false,
          });
        } catch (error) {
          caughtError = error as MutationError;
        }
      });

      expect(caughtError).toBeDefined();
      expect(caughtError).toBeInstanceOf(MutationError);
      expect(caughtError?.originalError).toBeInstanceOf(ApiError);

      const apiError = caughtError?.originalError as ApiError;

      expect(apiError.isValidationError()).toBe(true);
      expect(apiError.isNotFound()).toBe(false);

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
            id: 1,
            title: "Test",
            completed: false,
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
      server.use(
        http.delete("/api/todos/:id", () =>
          HttpResponse.json(
            { error: "Todo not found", code: "NOT_FOUND" },
            { status: 404 }
          )
        )
      );

      const { result } = renderHookWithSWR(() =>
        useSWRDelete(todosKey, deleteTodo)
      );

      await act(async () => {
        try {
          await result.current.trigger(999);
        } catch (error) {
          expect(error).toBeInstanceOf(MutationError);

          const mutationError = error as MutationError;

          expect(mutationError.originalError).toBeInstanceOf(ApiError);

          const apiError = mutationError.originalError as ApiError;

          expect(apiError.status).toBe(404);
          expect(apiError.isNotFound()).toBe(true);
          expect(apiError.isValidationError()).toBe(false);
        }
      });
    });
  });

  describe("Revalidation Timing", () => {
    it("should skip network request when revalidate is false", async () => {
      let fetchCount = 0;

      const countingFetcher = () => {
        fetchCount += 1;

        return fetchTodos();
      };

      const { result } = renderHookWithSWR(() =>
        useSWR(todosKey, countingFetcher, {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        })
      );

      await waitFor(() => expect(result.current.data).toBeDefined());

      expect(fetchCount).toBe(1);

      await act(async () => {
        await result.current.mutate(
          [{ id: 100, title: "Local Update", completed: true }],
          { revalidate: false }
        );
      });

      expect(fetchCount).toBe(1);
      expect(result.current.data?.[0].title).toBe("Local Update");
    });

    it("should trigger network request when revalidate is true", async () => {
      let fetchCount = 0;

      const countingFetcher = () => {
        fetchCount += 1;

        return fetchTodos();
      };

      const { result } = renderHookWithSWR(() =>
        useSWR(todosKey, countingFetcher, {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        })
      );

      await waitFor(() => expect(result.current.data).toBeDefined());

      expect(fetchCount).toBe(1);

      await act(async () => {
        await result.current.mutate(
          [{ id: 100, title: "Will Be Overwritten", completed: true }],
          { revalidate: true }
        );
      });

      await waitFor(() => {
        expect(fetchCount).toBe(2);
      });

      expect(result.current.data?.[0].title).toBe("Test Todo 1");
    });

    it("should default to revalidate when mutate is called without data", async () => {
      let fetchCount = 0;

      const countingFetcher = () => {
        fetchCount += 1;

        return fetchTodos();
      };

      const { result } = renderHookWithSWR(() =>
        useSWR(todosKey, countingFetcher, {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        })
      );

      await waitFor(() => expect(result.current.data).toBeDefined());

      expect(fetchCount).toBe(1);

      await act(async () => {
        await result.current.mutate();
      });

      await waitFor(() => {
        expect(fetchCount).toBe(2);
      });
    });

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
