import { mutate } from "swr";

import { MutationError } from "@/errors";
import { extractSWRKey } from "../extractSWRKey";

type CacheKeyInput = string | string[] | null | undefined;

/**
 * Resets the SWR cache by clearing all entries, with optional key preservation.
 *
 * This function clears the SWR cache while optionally preserving specific entries identified
 * by their `id` field. It's useful for scenarios like user logout, where you want to clear
 * user data but keep global/public data, or for testing/debugging purposes.
 *
 * @param preservedKeys - Keys to preserve in the cache:
 *   - `string`: Preserve a single key by ID
 *   - `string[]`: Preserve multiple keys by their IDs
 *   - `null` or `undefined`: Clear all cache entries (default)
 *
 * @returns Promise that resolves when the cache reset is complete
 * @throws {MutationError} Throws if the cache reset operation fails
 *
 * @example
 * // Clear all cache entries (e.g., on logout)
 * await resetCache();
 *
 * @example
 * // Clear all except "user" data
 * await resetCache("user");
 *
 * @example
 * // Clear all except specific IDs (e.g., keep global data)
 * await resetCache(["app-config", "feature-flags", "translations"]);
 *
 * @example
 * // Clear user data but keep public data on logout
 * const publicKeys = ["public-posts", "categories", "app-settings"];
 * await resetCache(publicKeys);
 *
 * @example
 * // Testing: Reset cache between test cases
 * afterEach(async () => {
 *   await resetCache();
 * });
 *
 * @remarks
 * - Uses `extractSWRKey` to parse and match serialized cache keys
 * - Only structured keys (with `id` field) can be preserved; other keys are always cleared
 * - The reset operation does not trigger revalidation (third parameter is false)
 * - Consider the performance impact when clearing large caches
 * - Use with caution in production - this affects all SWR caches in the application
 */
export const resetCache = async (preservedKeys: CacheKeyInput = []) => {
  let keys: string[] | null;
  if (Array.isArray(preservedKeys)) {
    keys = preservedKeys;
  } else if (preservedKeys) {
    keys = [preservedKeys];
  } else {
    keys = null;
  }

  try {
    await mutate(
      (key) => {
        if (!keys) {
          return true;
        }
        const extracted = extractSWRKey(key);
        return extracted ? !keys.includes(extracted.id) : true;
      },
      undefined,
      false
    );
  } catch (error) {
    throw new MutationError(
      `Failed to reset cache${
        keys ? ` (preserving: ${keys.join(", ")})` : ""
      }. ${error instanceof Error ? error.message : String(error)}`,
      {
        operation: "delete",
        key: null,
        timestamp: Date.now(),
      },
      error
    );
  }
};
