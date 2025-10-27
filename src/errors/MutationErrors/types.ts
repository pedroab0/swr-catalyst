import type { SWRKey } from "@/types";

/**
 * The type of mutation operation that was being performed.
 *
 * @remarks
 * Used in error context to identify what operation failed and generate appropriate error messages.
 */
export type MutationOperation = "create" | "update" | "delete";

/**
 * Contextual information about a failed mutation operation.
 *
 * This context is attached to every MutationError to provide detailed information
 * about what operation failed, which resource was involved, and when it happened.
 * This data is useful for error tracking, debugging, and user feedback.
 *
 * @example
 * // Context for a failed create operation
 * {
 *   operation: 'create',
 *   key: { id: 'todos', data: '/api/todos' },
 *   data: { title: 'New todo' },
 *   timestamp: 1698345600000
 * }
 *
 * @example
 * // Context for a failed update operation
 * {
 *   operation: 'update',
 *   key: { id: 'todos', data: '/api/todos' },
 *   data: { title: 'Updated title' },
 *   id: 123,
 *   timestamp: 1698345600000
 * }
 *
 * @example
 * // Context for a failed delete operation
 * {
 *   operation: 'delete',
 *   key: { id: 'todos', data: '/api/todos' },
 *   id: 123,
 *   timestamp: 1698345600000
 * }
 */
export type MutationErrorContext = {
  /**
   * The type of mutation that failed: 'create', 'update', or 'delete'.
   */
  operation: MutationOperation;

  /**
   * The structured SWR cache key that was being mutated.
   * Contains the resource ID, optional group, and data endpoint.
   * Can be null if the error occurred outside of a specific cache context.
   */
  key: SWRKey | null;

  /**
   * The data that was being sent to the server.
   * Present for 'create' and 'update' operations.
   *
   * @example { title: 'New todo', completed: false }
   */
  data?: unknown;

  /**
   * The ID of the resource being modified.
   * Present for 'update' and 'delete' operations.
   *
   * @example 123, "todo-abc", "user-456"
   */
  id?: string | number;

  /**
   * Timestamp (milliseconds since Unix epoch) when the error occurred.
   * Useful for error tracking and debugging timing-related issues.
   *
   * @example 1698345600000
   */
  timestamp: number;
};

/**
 * Extended Error constructor type with V8's captureStackTrace method.
 *
 * This type is used to properly type the Error constructor when calling
 * the V8-specific `captureStackTrace` method, which is not part of the
 * standard ECMAScript Error type but is available in V8-based environments
 * (Node.js, Chrome, Edge, etc.).
 *
 * @remarks
 * This is an internal type used for better stack trace handling in MutationError.
 * The type assertion is necessary because TypeScript's built-in Error type doesn't
 * include V8-specific extensions.
 */
export type ErrorConstructorWithStackTrace = typeof Error & {
  /**
   * V8-specific method to capture a stack trace.
   *
   * @param targetObject - The object to attach the stack trace to
   * @param constructorOpt - Optional constructor to exclude from the stack trace
   */
  captureStackTrace(targetObject: object, constructorOpt?: unknown): void;
};
