import { useCallback, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";

import type { MutateOptions, SWRKey } from "@/types";

import { swrMutate } from "@/utils";

import {
  applyOptimisticUpdate,
  createMutationError,
  rollbackOptimisticUpdate,
} from "../shared/helpers";

import { useStableKey } from "../useStableKey";

import type { UpdateFunction } from "./types";

/**
 * A hook for updating existing data with SWR cache management and optimistic updates.
 *
 * @template TData - The type of data being updated (e.g., `{ title: string }` for updating a todo)
 * @template TCache - The type of the cached data (e.g., `Todo[]` for a list of todos)
 * @template TError - The type of error that might be thrown (defaults to `Error`)
 *
 * @param key - The structured SWR cache key to revalidate after update.
 *   Must be an object with `id`, optional `group`, and `data` properties, or `null`.
 *   **Important:** The `key` object should have a stable reference (use `useMemo` if creating inline).
 *   The `data` property should be a primitive value (string, number) or a stable reference.
 *   Example: `{ id: 'todos', group: 'lists', data: '/api/todos' }`
 *
 * @param updateFunction - The async function that performs the API update call.
 *   Should accept an ID and the update data, returning the updated item from the server.
 *   Example: `async (todoId, updates) => api.patch(\`/todos/\${todoId}\`, updates)`
 *
 * @param options - Optional configuration:
 *   - `optimisticUpdate`: Function to update cache immediately before API call completes.
 *     Receives `(currentData, { id, data })` and should return the optimistically updated cache.
 *     Example: `(todos, { id, data }) => todos.map(t => t.id === id ? { ...t, ...data } : t)`
 *   - `rollbackOnError`: Whether to revert optimistic update if API fails (default: `true`)
 *
 * @returns An object containing:
 *   - `trigger`: Async function to call when updating data. Accepts ID and data, returns updated item.
 *   - `isMutating`: Boolean indicating if mutation is in progress (useful for loading states)
 *   - `error`: Error object if mutation failed, otherwise `null`
 *
 * @example
 * // Basic usage with structured key
 * const { trigger, isMutating, error } = useSWRUpdate(
 *   { id: 'todos', group: 'lists', data: '/api/todos' },
 *   async (todoId, updates) => api.patch(\`/todos/\${todoId}\`, updates)
 * );
 *
 * await trigger(123, { completed: true });
 *
 * @example
 * // With optimistic updates (instant UI update)
 * const { trigger, isMutating } = useSWRUpdate(
 *   { id: 'todos', data: '/api/todos' },
 *   updateTodoAPI,
 *   {
 *     optimisticUpdate: (todos, { id, data }) =>
 *       todos.map(todo =>
 *         todo.id === id ? { ...todo, ...data } : todo
 *       ),
 *     rollbackOnError: true
 *   }
 * );
 *
 * // Todo updates immediately, then syncs with server
 * await trigger(todoId, { title: 'Updated title' });
 *
 * @example
 * // With error handling
 * const { trigger, error } = useSWRUpdate(
 *   { id: 'todos', data: '/api/todos' },
 *   updateTodoAPI
 * );
 *
 * try {
 *   const updated = await trigger(todoId, { completed: true });
 *   console.log('Updated:', updated);
 * } catch (err) {
 *   console.error('Failed to update:', err);
 * }
 *
 * // Or use the error state
 * if (error) {
 *   return <div>Error: {error.message}</div>;
 * }
 *
 * @example
 * // With loading state for inline editing
 * const { trigger, isMutating } = useSWRUpdate(
 *   { id: 'todos', data: '/api/todos' },
 *   updateTodoAPI
 * );
 *
 * return (
 *   <input
 *     onBlur={(e) => trigger(todoId, { title: e.target.value })}
 *     disabled={isMutating}
 *   />
 * );
 *
 * @example
 * // Toggle boolean field
 * const { trigger } = useSWRUpdate(
 *   { id: 'todos', data: '/api/todos' },
 *   updateTodoAPI,
 *   {
 *     optimisticUpdate: (todos, { id, data }) =>
 *       todos.map(t => t.id === id ? { ...t, ...data } : t)
 *   }
 * );
 *
 * const toggleComplete = (todo) => {
 *   trigger(todo.id, { completed: !todo.completed });
 * };
 *
 * @example
 * // Using with group for batch cache operations
 * const { trigger } = useSWRUpdate(
 *   { id: 'user-todos', group: 'user-data', data: '/api/user/todos' },
 *   updateTodoAPI
 * );
 *
 * // Later, you can use mutateByGroup('user-data') to revalidate all related caches
 */
export function useSWRUpdate<TData = unknown, TCache = unknown, TError = Error>(
  key: SWRKey,
  updateFunction: UpdateFunction<TData, TCache>,
  options: MutateOptions<TCache, { id: string | number; data: TData }> = {}
) {
  const { cache, mutate } = useSWRConfig();
  const { optimisticUpdate, rollbackOnError = true } = options;

  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<TError | null>(null);

  const isMountedRef = useRef(true);

  const stableKey = useStableKey(key);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const trigger = useCallback(
    async (id: string | number, data: TData) => {
      if (!isMountedRef.current) {
        return;
      }

      setIsMutating(true);
      setError(null);

      let originalData: TCache | undefined;

      if (optimisticUpdate) {
        originalData = await applyOptimisticUpdate(cache, mutate, stableKey, {
          data: { id, data },
          optimisticUpdateFn: optimisticUpdate,
        });
      }

      try {
        const newData = await updateFunction(id, data);

        if (!isMountedRef.current) {
          return newData;
        }

        await swrMutate(mutate, stableKey);

        return newData;
      } catch (err) {
        if (rollbackOnError && optimisticUpdate) {
          await rollbackOptimisticUpdate(mutate, stableKey, originalData);
        }

        const mutationError = createMutationError("update", stableKey, err, {
          data,
          id,
        });

        if (isMountedRef.current) {
          setError(mutationError as TError);
        }

        throw mutationError;
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false);
        }
      }
    },
    [
      stableKey,
      updateFunction,
      mutate,
      cache,
      optimisticUpdate,
      rollbackOnError,
    ]
  );

  return {
    trigger,
    isMutating,
    error,
  };
}
