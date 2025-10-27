import type { Cache, ScopedMutator } from "swr";

import type { SWRKey } from "@/types";

import { swrGetCache, swrMutate } from "@/utils";

/**
 * Applies an optimistic update to the SWR cache before the mutation completes.
 *
 * This function immediately updates the cache with optimistic data, allowing the UI
 * to reflect changes instantly before the server responds. It saves the original data
 * so it can be rolled back if the mutation fails.
 *
 * @template TData - The type of data being mutated
 * @template TCache - The type of the cached data
 *
 * @param cache - The SWR cache instance from useSWRConfig()
 * @param mutate - The SWR mutate function from useSWRConfig()
 * @param stableKey - The stable SWR cache key to update
 * @param payload - Configuration object containing:
 *   - `data`: The new data being sent to the server
 *   - `optimisticUpdateFn`: Function that receives current cache data and new data,
 *     and returns the optimistically updated cache
 *
 * @returns The original cache data before the optimistic update, for potential rollback
 *
 * @example
 * // Add new todo optimistically
 * const originalData = await applyOptimisticUpdate(cache, mutate, key, {
 *   data: newTodo,
 *   optimisticUpdateFn: (todos, newTodo) => [...todos, { ...newTodo, id: 'temp' }]
 * });
 *
 * @example
 * // Update todo optimistically
 * const originalData = await applyOptimisticUpdate(cache, mutate, key, {
 *   data: { id: 123, title: 'Updated' },
 *   optimisticUpdateFn: (todos, update) =>
 *     todos.map(t => t.id === update.id ? { ...t, ...update } : t)
 * });
 *
 * @remarks
 * - This function is used internally by mutation hooks when `optimisticUpdate` option is provided
 * - The mutation is applied without revalidation (false flag) to prevent immediate server fetch
 * - Always save the return value to enable rollback on error
 */
export async function applyOptimisticUpdate<TData, TCache>(
  cache: Cache,
  mutate: ScopedMutator,
  stableKey: SWRKey,
  payload: {
    data: TData;
    optimisticUpdateFn: (
      currentData: TCache | undefined,
      newData: TData
    ) => TCache;
  }
): Promise<TCache | undefined> {
  const originalData = swrGetCache(cache, stableKey)?.data;

  const optimisticData = payload.optimisticUpdateFn(originalData, payload.data);

  await swrMutate(mutate, stableKey, optimisticData, false);

  return originalData;
}
