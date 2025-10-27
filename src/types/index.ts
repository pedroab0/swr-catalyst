/**
 * Configuration options for mutation operations with optimistic updates.
 *
 * @template TCache - The type of the cached data (e.g., `Todo[]` for a list)
 * @template TData - The type of the mutation data (e.g., `Todo` for a single item)
 */
export type MutateOptions<TCache, TData> = {
  /**
   * Function to optimistically update the cache before the mutation completes.
   *
   * Receives the current cached data and the new data being sent, and should return
   * the updated cache value. This allows the UI to update instantly before the server responds.
   *
   * @param currentData - The current cache data (undefined if not yet fetched)
   * @param data - The new data being sent to the server
   * @returns The optimistically updated cache data
   *
   * @example
   * // For create operations - add new item
   * optimisticUpdate: (todos, newTodo) => [...todos, { ...newTodo, id: 'temp' }]
   *
   * @example
   * // For update operations - update existing item
   * optimisticUpdate: (todos, { id, data }) =>
   *   todos.map(t => t.id === id ? { ...t, ...data } : t)
   *
   * @example
   * // For delete operations - remove item
   * optimisticUpdate: (todos, id) => todos.filter(t => t.id !== id)
   */
  optimisticUpdate?: (currentData: TCache | undefined, data: TData) => TCache;

  /**
   * Whether to rollback the optimistic update if the mutation fails.
   *
   * When true (default), the cache will be restored to its original state if an error occurs.
   * Set to false to keep the optimistic update even on error (useful for offline-first apps).
   *
   * @default true
   *
   * @example
   * // Rollback on error (default behavior)
   * { rollbackOnError: true }
   *
   * @example
   * // Keep optimistic update even on error
   * { rollbackOnError: false }
   */
  rollbackOnError?: boolean;
};

/**
 * Structured cache key for SWR with support for grouping and custom data.
 *
 * This key format enables advanced cache management features like:
 * - Batch mutations by ID or group
 * - Cache organization and relationships
 * - Type-safe key handling
 *
 * @template T - The type of the data property (typically a string URL or identifier)
 *
 * @example
 * // Simple key with ID and data
 * const key: SWRKey = {
 *   id: 'todos',
 *   data: '/api/todos'
 * };
 *
 * @example
 * // Grouped key for related data
 * const key: SWRKey = {
 *   id: 'user-profile',
 *   group: 'user-data',
 *   data: '/api/user'
 * };
 *
 * @example
 * // Conditional key (null when not ready)
 * const key: SWRKey = userId
 *   ? { id: 'user', data: `/api/users/${userId}` }
 *   : null;
 */
export type SWRKey<T = unknown> = {
  /**
   * Unique identifier for the cache entry.
   * Used by `mutateById()` to update specific caches.
   *
   * @example 'todos', 'user-profile', 'posts'
   */
  id: string;

  /**
   * Optional group name for organizing related caches.
   * Used by `mutateByGroup()` to batch update multiple related caches.
   *
   * @example 'user-data', 'admin-panel', 'public-content'
   */
  group?: string;

  /**
   * The actual data used for cache lookups and fetching.
   * Typically a URL endpoint, but can be any serializable value.
   *
   * @example '/api/todos', '/api/users/123', { endpoint: '/api/data', params: {...} }
   */
  data: T;
} | null;
