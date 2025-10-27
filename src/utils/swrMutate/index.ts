import type { ScopedMutator } from "swr";

import type { SWRKey } from "@/types";

/**
 * Type-safe wrapper around SWR's mutate function that handles structured SWRKey objects.
 *
 * This wrapper function bridges the gap between SWR's TypeScript definitions and runtime behavior.
 * While SWR's types expect string keys, the runtime actually supports object keys through internal
 * serialization. This function provides a type-safe interface for mutating cache with object keys.
 *
 * @template TData - The type of data in the cache key
 *
 * @param mutate - The mutate function from useSWRConfig()
 * @param key - The structured SWR cache key (must have `id` and `data` properties)
 * @param data - Optional new data to update the cache with
 * @param shouldRevalidate - Whether to revalidate after mutation (default: true)
 *
 * @returns Promise that resolves when the mutation is complete
 *
 * @example
 * // Revalidate a specific cache key
 * const { mutate } = useSWRConfig();
 * await swrMutate(mutate, { id: 'todos', data: '/api/todos' });
 *
 * @example
 * // Update cache without revalidation (optimistic update)
 * await swrMutate(mutate, key, newTodosList, false);
 *
 * @example
 * // Update with revalidation
 * await swrMutate(mutate, key, updatedData, true);
 *
 * @example
 * // Grouped cache mutation
 * await swrMutate(
 *   mutate,
 *   { id: 'user-posts', group: 'user-data', data: '/api/posts' }
 * );
 *
 * @remarks
 * - This function uses a type assertion because SWR's TypeScript definitions are restrictive
 * - SWR's runtime handles object keys via `unstable_serialize()` internally
 * - When `data` is provided and `shouldRevalidate` is false, performs optimistic update
 * - When `data` is undefined (or not provided), triggers revalidation from server
 * - This is an internal utility used by all mutation hooks
 * - The revalidation behavior depends on SWR's configuration (dedupingInterval, etc.)
 */
export function swrMutate<TData = unknown>(
  mutate: ScopedMutator,
  key: SWRKey<TData>,
  data?: unknown,
  shouldRevalidate?: boolean
): Promise<unknown> {
  return mutate(
    key as unknown as Parameters<ScopedMutator>[0],
    data,
    shouldRevalidate
  );
}
