import type { ScopedMutator } from "swr";

import type { SWRKey } from "@/types";

import { swrMutate } from "@/utils";

/**
 * Rolls back an optimistic update by restoring the original cache data.
 *
 * This function is called when a mutation fails and `rollbackOnError` is true.
 * It restores the cache to its state before the optimistic update was applied,
 * ensuring the UI accurately reflects the server state.
 *
 * @param mutate - The SWR mutate function from useSWRConfig()
 * @param stableKey - The stable SWR cache key to restore
 * @param originalData - The original cache data to restore (saved from applyOptimisticUpdate)
 *
 * @returns Promise that resolves when the rollback is complete
 *
 * @example
 * // Used internally by mutation hooks on error
 * try {
 *   const result = await apiCall();
 * } catch (error) {
 *   // Restore original data if mutation fails
 *   await rollbackOptimisticUpdate(mutate, key, originalData);
 *   throw error;
 * }
 *
 * @remarks
 * - This function is automatically called by mutation hooks when `rollbackOnError: true` (default)
 * - The mutation is applied without revalidation (false flag) for immediate UI update
 * - Set `rollbackOnError: false` in mutation options to keep optimistic data on error
 */
export async function rollbackOptimisticUpdate(
  mutate: ScopedMutator,
  stableKey: SWRKey,
  originalData: unknown
): Promise<void> {
  await swrMutate(mutate, stableKey, originalData, false);
}
