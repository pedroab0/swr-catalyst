import type { MutatorOptions } from "swr";
import { mutate } from "swr";

import { MutationError, type MutationErrorContext } from "@/errors";
import { extractSWRKey } from "../extractSWRKey";

/**
 * Mutates all SWR cache entries that belong to one or more groups.
 *
 * This function updates or revalidates cache entries based on the `group` field in structured
 * SWR keys. Groups allow you to organize related caches and update them together. This is
 * particularly useful for managing related data that should be refreshed as a batch.
 *
 * @template T - The type of data to update the cache with
 *
 * @param groups - A single group name or an array of group names to match in SWR keys
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
 * // Update all caches in "users" group
 * await mutateByGroup("users", updatedUsersList);
 *
 * @example
 * // Revalidate multiple groups (e.g., after user login)
 * await mutateByGroup(["user-data", "user-settings", "notifications"]);
 *
 * @example
 * // Update without revalidation
 * await mutateByGroup("posts", newPostsList, { revalidate: false });
 *
 * @example
 * // Organizing related data with groups
 * // Keys: { id: 'user-profile', group: 'user-data', data: '/api/user' }
 * //       { id: 'user-posts', group: 'user-data', data: '/api/posts' }
 * //       { id: 'user-comments', group: 'user-data', data: '/api/comments' }
 * //
 * // Refresh all user-related data at once:
 * await mutateByGroup("user-data");
 *
 * @remarks
 * - Only matches keys that have a `group` field defined
 * - Uses `extractSWRKey` to parse serialized cache keys
 * - If `newData` is provided, default revalidation is disabled
 * - If `newData` is omitted, caches are revalidated from the server by default
 * - Groups are optional in SWR keys - keys without groups won't be matched
 */
export async function mutateByGroup<T = unknown>(
  group: string | string[],
  newData?: T,
  options?: MutatorOptions
): Promise<void> {
  const groups = Array.isArray(group) ? group : [group];

  try {
    await mutate(
      (key) => {
        const extracted = extractSWRKey(key);
        return extracted?.group ? groups.includes(extracted.group) : false;
      },
      newData ? () => newData : undefined,
      {
        revalidate: options?.revalidate ?? !newData,
        ...options,
      }
    );
  } catch (error) {
    throw new MutationError(
      `Failed to mutate cache by group(s): ${groups.join(", ")}. ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        operation: "update",
        key: null,
        data: newData,
        timestamp: Date.now(),
      } as MutationErrorContext,
      error
    );
  }
}
