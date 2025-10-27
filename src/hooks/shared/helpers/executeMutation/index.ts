import type { ScopedMutator } from "swr";

import type { MutationError } from "@/errors";
import type { SWRKey } from "@/types";

import { swrMutate } from "@/utils";

import { rollbackOptimisticUpdate } from "../rollbackOptimisticUpdate";

/**
 * Executes a mutation function with automatic error handling and cache rollback.
 *
 * This helper function orchestrates the mutation execution flow:
 * 1. Executes the mutation function
 * 2. On success: Revalidates the cache
 * 3. On error: Optionally rolls back optimistic updates, calls error handler, and re-throws
 *
 * @template TResult - The type of data returned by the mutation
 * @template TCache - The type of the cached data
 *
 * @param mutationFn - The async function to execute (API call)
 * @param options - Configuration object:
 *   - `mutate`: The SWR mutate function from useSWRConfig()
 *   - `stableKey`: The stable SWR cache key
 *   - `shouldRollback`: Whether to rollback optimistic update on error
 *   - `originalData`: The original cache data to restore on rollback
 *   - `onError`: Callback function to handle errors (typically sets error state)
 *
 * @returns The result from the mutation function
 * @throws Re-throws the MutationError after handling rollback and error callback
 *
 * @example
 * // Used internally by mutation hooks
 * const result = await executeMutation(
 *   () => api.post('/todos', newTodo),
 *   {
 *     mutate,
 *     stableKey,
 *     shouldRollback: rollbackOnError && !!optimisticUpdate,
 *     originalData,
 *     onError: (err) => setError(err)
 *   }
 * );
 *
 * @remarks
 * - This function is used internally by mutation hooks to reduce code duplication
 * - Automatically revalidates cache on success
 * - Handles rollback only if both shouldRollback is true and originalData exists
 * - Always calls onError callback before re-throwing to allow state updates
 */
export async function executeMutation<TResult, TCache>(
  mutationFn: () => Promise<TResult>,
  options: {
    mutate: ScopedMutator;
    stableKey: SWRKey;
    shouldRollback: boolean;
    originalData?: TCache;
    onError: (error: MutationError) => void;
  }
): Promise<TResult> {
  try {
    const result = await mutationFn();

    await swrMutate(options.mutate, options.stableKey);

    return result;
  } catch (err) {
    if (options.shouldRollback && options.originalData !== undefined) {
      await rollbackOptimisticUpdate(
        options.mutate,
        options.stableKey,
        options.originalData
      );
    }

    const mutationError = err as MutationError;

    options.onError(mutationError);

    throw mutationError;
  }
}
