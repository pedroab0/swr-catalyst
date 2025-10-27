import type { MutatorOptions } from "swr";
import { mutate } from "swr";

import { MutationError } from "@/errors";
import { extractSWRKey } from "../extractSWRKey";

/**
 * Mutates all SWR cache entries that match one or more resource IDs.
 *
 * This function updates or revalidates cache entries based on the `id` field in structured
 * SWR keys. It's useful for updating related data when a resource changes, or for
 * invalidating multiple caches at once.
 *
 * @template T - The type of data to update the cache with
 *
 * @param ids - A single ID string or an array of ID strings to match in SWR keys
 * @param newData - Optional new data to update matching caches with.
 *   If omitted, caches are revalidated without data update
 * @param options - Optional SWR mutator options:
 *   - `revalidate`: Whether to trigger revalidation (default: true if no newData, false otherwise)
 *   - `populateCache`: Whether to update the cache with returned data
 *   - `rollbackOnError`: Whether to rollback on error
 *   - `optimisticData`: Data to use for optimistic UI updates
 *
 * @returns Promise that resolves when all matching caches are updated
 * @throws {MutationError} Throws if the cache mutation fails, with context about the operation
 *
 * @example
 * // Update all caches with id "user"
 * await mutateById("user", { name: "Pedro Barbosa", age: 30 });
 *
 * @example
 * // Revalidate multiple related caches without updating data
 * await mutateById(["todos", "user", "settings"]);
 *
 * @example
 * // Update with custom revalidation options
 * await mutateById("todos", newTodosList, {
 *   revalidate: false, // Don't fetch from server
 *   populateCache: true
 * });
 *
 * @example
 * // Clear all user-related caches
 * await mutateById(["user", "user-profile", "user-settings"], undefined, {
 *   revalidate: false
 * });
 *
 * @remarks
 * - Uses `extractSWRKey` to parse serialized cache keys
 * - Only matches keys with a structured format (containing an `id` field)
 * - If `newData` is provided, default revalidation is disabled (set explicitly if needed)
 * - If `newData` is omitted, caches are revalidated from the server by default
 */
export async function mutateById<T = unknown>(
  ids: string | string[],
  newData?: T,
  options?: MutatorOptions
): Promise<void> {
  const idList = typeof ids === "string" ? [ids] : ids;

  try {
    await mutate(
      (cacheKey) => {
        const extractedKey = extractSWRKey(cacheKey);
        return extractedKey ? idList.includes(extractedKey?.id) : false;
      },
      newData ? () => newData : undefined,
      {
        revalidate: options?.revalidate ?? !newData,
        ...options,
      }
    );
  } catch (error) {
    throw new MutationError(
      `Failed to mutate cache by ID(s): ${idList.join(", ")}. ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        operation: "update",
        key: null,
        data: newData,
        timestamp: Date.now(),
      },
      error
    );
  }
}
