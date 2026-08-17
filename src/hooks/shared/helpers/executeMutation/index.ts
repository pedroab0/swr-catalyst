import type { RefObject } from "react";
import type { ScopedMutator } from "swr";

import type { SWRKey } from "@/types";

import { MutationError, type MutationOperation } from "@/errors";
import { swrMutate } from "@/utils";

import { createMutationError } from "../createMutationError";
import { rollbackOptimisticUpdate } from "../rollbackOptimisticUpdate";

/**
 * Executes a mutation function with automatic error handling and cache rollback.
 *
 * This helper function orchestrates the mutation execution flow:
 * 1. Executes the mutation function
 * 2. On success: Revalidates the cache (if component is still mounted)
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
 *   - `mutationType`: Optional mutation type name ('create' | 'update' | 'delete')
 *   - `isMountedRef`: Optional ref indicating if host component is mounted
 *   - `onError`: Callback function to handle errors (typically sets error state)
 *
 * @returns The result from the mutation function
 * @throws Re-throws the MutationError after handling rollback and error callback
 */
export async function executeMutation<TResult, TCache>(
  mutationFn: () => Promise<TResult>,
  options: {
    mutate: ScopedMutator;
    stableKey: SWRKey;
    shouldRollback: boolean;
    originalData?: TCache;
    mutationType?: MutationOperation;
    isMountedRef?: RefObject<boolean>;
    onError: (error: MutationError) => void;
  }
): Promise<TResult> {
  try {
    const result = await mutationFn();

    if (options.isMountedRef && !options.isMountedRef.current) {
      return result;
    }

    await swrMutate(options.mutate, options.stableKey);

    return result;
  } catch (err) {
    if (options.shouldRollback) {
      await rollbackOptimisticUpdate(
        options.mutate,
        options.stableKey,
        options.originalData
      );
    }

    const mutationError =
      err instanceof MutationError
        ? err
        : createMutationError(
            options.mutationType ?? "create",
            options.stableKey,
            err
          );

    options.onError(mutationError);

    throw mutationError;
  }
}
