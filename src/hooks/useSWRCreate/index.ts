import { useCallback, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";

import type { MutateOptions, SWRKey } from "@/types";

import { swrMutate } from "@/utils";

import {
  applyOptimisticUpdate,
  createMutationError,
  rollbackOptimisticUpdate,
} from "../shared";

import { useStableKey } from "../useStableKey";

import type { CreateFunction } from "./types";

/**
 * A hook for creating new data with SWR cache management and optimistic updates.
 *
 * @template TData - The type of data being created (e.g., `{ title: string }` for a new todo)
 * @template TCache - The type of the cached data (e.g., `Todo[]` for a list of todos)
 * @template TError - The type of error that might be thrown (defaults to `Error`)
 *
 * @param key - The structured SWR cache key to revalidate after creation.
 *   Must be an object with `id`, optional `group`, and `data` properties, or `null`.
 *   **Important:** The `key` object should have a stable reference (use `useMemo` if creating inline).
 *   The `data` property should be a primitive value (string, number) or a stable reference.
 *   Example: `{ id: 'todos', group: 'lists', data: '/api/todos' }`
 *
 * @param createFunction - The async function that performs the API call.
 *   Should accept the new data and return the created item from the server.
 *   Example: `async (newTodo) => api.post('/todos', newTodo)`
 *
 * @param options - Optional configuration:
 *   - `optimisticUpdate`: Function to update cache immediately before API call completes.
 *     Receives `(currentData, newData)` and should return the optimistically updated cache.
 *     Example: `(todos, newTodo) => [...todos, { ...newTodo, id: 'temp-id' }]`
 *   - `rollbackOnError`: Whether to revert optimistic update if API fails (default: `true`)
 *
 * @returns An object containing:
 *   - `trigger`: Async function to call when creating data. Returns the created data from server.
 *   - `isMutating`: Boolean indicating if mutation is in progress (useful for loading states)
 *   - `error`: Error object if mutation failed, otherwise `null`
 *
 * @example
 * // Basic usage with structured key
 * const { trigger, isMutating, error } = useSWRCreate(
 *   { id: 'todos', group: 'lists', data: '/api/todos' },
 *   async (newTodo) => api.post('/todos', newTodo)
 * );
 *
 * await trigger({ title: 'Buy milk' });
 *
 * @example
 * // With optimistic updates
 * const { trigger, isMutating } = useSWRCreate(
 *   { id: 'todos', data: '/api/todos' },
 *   createTodoAPI,
 *   {
 *     optimisticUpdate: (todos, newTodo) => [
 *       ...todos,
 *       { ...newTodo, id: 'temp-' + Date.now() }
 *     ],
 *     rollbackOnError: true
 *   }
 * );
 *
 * // UI updates immediately, then syncs with server
 * await trigger({ title: 'New task', completed: false });
 *
 * @example
 * // With error handling
 * const { trigger, error } = useSWRCreate(
 *   { id: 'todos', data: '/api/todos' },
 *   createTodoAPI
 * );
 *
 * try {
 *   const created = await trigger({ title: 'New todo' });
 *   console.log('Created with ID:', created.id);
 * } catch (err) {
 *   console.error('Failed to create:', err);
 * }
 *
 * // Or use the error state
 * if (error) {
 *   return <div>Error: {error.message}</div>;
 * }
 *
 * @example
 * // Using with group for batch cache operations
 * const { trigger } = useSWRCreate(
 *   { id: 'user-todos', group: 'user-data', data: '/api/user/todos' },
 *   createTodoAPI
 * );
 *
 * // Later, you can use mutateByGroup('user-data') to revalidate all related caches
 */
export function useSWRCreate<TData = unknown, TCache = unknown, TError = Error>(
  key: SWRKey<TData>,
  createFunction: CreateFunction<TData, TCache>,
  options: MutateOptions<TCache, TData> = {}
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
    async (data: TData) => {
      if (!isMountedRef.current) {
        return;
      }

      setIsMutating(true);
      setError(null);

      let originalData: TCache | undefined;

      if (optimisticUpdate) {
        originalData = await applyOptimisticUpdate(cache, mutate, stableKey, {
          data,
          optimisticUpdateFn: optimisticUpdate,
        });
      }

      try {
        const newData = await createFunction(data);

        if (!isMountedRef.current) {
          return newData;
        }

        await swrMutate(mutate, stableKey);

        return newData;
      } catch (err) {
        if (rollbackOnError && optimisticUpdate) {
          await rollbackOptimisticUpdate(mutate, stableKey, originalData);
        }

        const mutationError = createMutationError("create", stableKey, err, {
          data,
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
      createFunction,
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
