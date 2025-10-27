import { MutationError } from "@/errors";

import type { SWRKey } from "@/types";

/**
 * Creates a standardized MutationError with contextual information.
 *
 * This helper function constructs a consistent error object across all mutation hooks,
 * including the operation type, resource information, and original error. It generates
 * a descriptive error message that includes the operation, resource name, and any ID.
 *
 * @param operation - The type of mutation operation: 'create', 'update', or 'delete'
 * @param stableKey - The SWR cache key that was being mutated (or null if unknown)
 * @param err - The original error thrown by the mutation function
 * @param additionalContext - Optional additional context:
 *   - `data`: The data being sent (for create/update operations)
 *   - `id`: The resource ID (for update/delete operations)
 *
 * @returns A new MutationError instance with full context
 *
 * @example
 * // Create error for failed creation
 * const error = createMutationError('create', key, err, {
 *   data: { title: 'New todo' }
 * });
 * // Error message: "Failed to create resource "todos". Network error"
 *
 * @example
 * // Create error for failed update with ID
 * const error = createMutationError('update', key, err, {
 *   data: { title: 'Updated' },
 *   id: 123
 * });
 * // Error message: "Failed to update resource "todos" with ID 123. Validation error"
 *
 * @example
 * // Create error for failed deletion
 * const error = createMutationError('delete', key, err, { id: 123 });
 * // Error message: "Failed to delete resource "todos" with ID 123. Not found"
 *
 * @remarks
 * This function is used internally by all mutation hooks to create consistent error objects.
 * The resulting MutationError includes helper methods like `isNetworkError()` and `getUserMessage()`.
 */
export function createMutationError(
  operation: "create" | "update" | "delete",
  stableKey: SWRKey,
  err: unknown,
  additionalContext?: { data?: unknown; id?: string | number }
): MutationError {
  const resource = stableKey?.id || "unknown";

  const idPart = additionalContext?.id
    ? ` with ID ${additionalContext.id}`
    : "";

  const message = `Failed to ${operation} resource "${resource}"${idPart}. ${
    err instanceof Error ? err.message : String(err)
  }`;

  return new MutationError(
    message,
    {
      operation,
      key: stableKey,
      ...additionalContext,
      timestamp: Date.now(),
    },
    err
  );
}
