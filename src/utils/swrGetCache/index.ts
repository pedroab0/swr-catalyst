import type { Cache } from "swr";

import type { SWRKey } from "@/types";

/**
 * Type-safe wrapper around SWR's cache.get() that handles structured SWRKey objects.
 *
 * This wrapper function bridges the gap between SWR's TypeScript definitions and runtime behavior.
 * While SWR's types expect string keys, the runtime actually supports object keys through internal
 * serialization. This function provides a type-safe interface for accessing cache with object keys.
 *
 * @template TData - The type of data stored in the cache
 *
 * @param cache - The cache object from useSWRConfig()
 * @param key - The structured SWR cache key (must have `id` and `data` properties)
 *
 * @returns The cached data if found, or `undefined` if:
 *   - The key is null
 *   - No data exists for the key
 *   - The cache entry has expired
 *
 * @example
 * // Get cached todos
 * const { cache } = useSWRConfig();
 * const cachedTodos = swrGetCache(cache, { id: 'todos', data: '/api/todos' });
 * if (cachedTodos) {
 *   console.log('Cache hit:', cachedTodos);
 * }
 *
 * @example
 * // Check cache before mutation
 * const currentData = swrGetCache(cache, key);
 * const optimisticData = [...currentData, newItem];
 * await swrMutate(mutate, key, optimisticData, false);
 *
 * @example
 * // Get grouped cache data
 * const userData = swrGetCache(cache, {
 *   id: 'user-profile',
 *   group: 'user-data',
 *   data: '/api/user'
 * });
 *
 * @remarks
 * - This function uses a type assertion because SWR's TypeScript definitions are restrictive
 * - SWR's runtime handles object keys via `unstable_serialize()` internally
 * - Returns `undefined` for null keys (safe guard)
 * - The cache value includes metadata; access `.data` property for the actual data
 * - This is an internal utility used by mutation hooks for optimistic updates
 */
export function swrGetCache<TData = unknown>(cache: Cache, key: SWRKey<TData>) {
  if (!key) {
    return;
  }

  return cache.get(key as unknown as Parameters<Cache["get"]>[0]);
}
