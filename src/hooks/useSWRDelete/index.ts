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

import type { DeleteFunction } from "./types";

/**
 * A hook for deleting data with SWR cache management and optimistic updates.
 *
 * @template TCache - The type of the cached data (e.g., `Todo[]` for a list of todos)
 * @template TResult - The type of the result returned by the delete API (e.g., `{ success: boolean }`)
 * @template TError - The type of error that might be thrown (defaults to `Error`)
 *
 * @param key - The structured SWR cache key to revalidate after deletion.
 *   Must be an object with `id`, optional `group`, and `data` properties, or `null`.
 *   **Important:** The `key` object should have a stable reference (use `useMemo` if creating inline).
 *   The `data` property should be a primitive value (string, number) or a stable reference.
 *   Example: `{ id: 'todos', group: 'lists', data: '/api/todos' }`
 *
 * @param deleteFunction - The async function that performs the API delete call.
 *   Should accept an ID and return the result from the server.
 *   Example: `async (todoId) => api.delete(\`/todos/\${todoId}\`)`
 *
 * @param options - Optional configuration:
 *   - `optimisticUpdate`: Function to update cache immediately before API call completes.
 *     Receives `(currentData, itemId)` and should return the optimistically updated cache.
 *     Example: `(todos, id) => todos.filter(todo => todo.id !== id)`
 *   - `rollbackOnError`: Whether to revert optimistic update if API fails (default: `true`)
 *
 * @returns An object containing:
 *   - `trigger`: Async function to call when deleting data. Accepts the ID and returns the API result.
 *   - `isMutating`: Boolean indicating if mutation is in progress (useful for loading states)
 *   - `error`: Error object if mutation failed, otherwise `null`
 *
 * @example
 * // Basic usage with structured key
 * const { trigger, isMutating, error } = useSWRDelete(
 *   { id: 'todos', group: 'lists', data: '/api/todos' },
 *   async (todoId) => api.delete(\`/todos/\${todoId}\`)
 * );
 *
 * await trigger(123);
 *
 * @example
 * // With optimistic updates (instant removal from UI)
 * const { trigger, isMutating } = useSWRDelete(
 *   { id: 'todos', data: '/api/todos' },
 *   deleteTodoAPI,
 *   {
 *     optimisticUpdate: (todos, todoId) =>
 *       todos.filter(todo => todo.id !== todoId),
 *     rollbackOnError: true
 *   }
 * );
 *
 * // Todo disappears immediately, then syncs with server
 * await trigger(todoId);
 *
 * @example
 * // With error handling
 * const { trigger, error } = useSWRDelete(
 *   { id: 'todos', data: '/api/todos' },
 *   deleteTodoAPI
 * );
 *
 * try {
 *   const result = await trigger(todoId);
 *   console.log('Deleted:', result);
 * } catch (err) {
 *   console.error('Failed to delete:', err);
 * }
 *
 * // Or use the error state
 * if (error) {
 *   return <div>Error: {error.message}</div>;
 * }
 *
 * @example
 * // With loading state for button
 * const { trigger, isMutating } = useSWRDelete(
 *   { id: 'todos', data: '/api/todos' },
 *   deleteTodoAPI
 * );
 *
 * return (
 *   <button
 *     onClick={() => trigger(todoId)}
 *     disabled={isMutating}
 *   >
 *     {isMutating ? 'Deleting...' : 'Delete'}
 *   </button>
 * );
 *
 * @example
 * // Using with group for batch cache operations
 * const { trigger } = useSWRDelete(
 *   { id: 'user-todos', group: 'user-data', data: '/api/user/todos' },
 *   deleteTodoAPI
 * );
 *
 * // Later, you can use mutateByGroup('user-data') to revalidate all related caches
 */
export function useSWRDelete<
  TCache = unknown,
  TResult = unknown,
  TError = Error,
>(
  key: SWRKey,
  deleteFunction: DeleteFunction<TResult>,
  options: MutateOptions<TCache, string | number> = {}
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
    async (id: string | number) => {
      if (!isMountedRef.current) {
        return;
      }

      setIsMutating(true);
      setError(null);

      let originalData: TCache | undefined;

      if (optimisticUpdate) {
        originalData = await applyOptimisticUpdate(cache, mutate, stableKey, {
          data: id,
          optimisticUpdateFn: optimisticUpdate,
        });
      }

      try {
        const result = await deleteFunction(id);

        if (!isMountedRef.current) {
          return result;
        }

        await swrMutate(mutate, stableKey);

        return result;
      } catch (err) {
        if (rollbackOnError && optimisticUpdate) {
          await rollbackOptimisticUpdate(mutate, stableKey, originalData);
        }

        const mutationError = createMutationError("delete", stableKey, err, {
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
      deleteFunction,
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
