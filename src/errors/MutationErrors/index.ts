import type {
  ErrorConstructorWithStackTrace,
  MutationErrorContext,
} from "./types";

/**
 * Custom error class for mutation operations.
 * Provides consistent error handling with context across all hooks and utilities.
 */
export class MutationError extends Error {
  readonly name = "MutationError";
  readonly context: MutationErrorContext;
  readonly originalError: unknown;

  /**
   * Creates a new MutationError with context and original error information.
   *
   * @param message - Human-readable error message describing what failed
   * @param context - Contextual information about the mutation operation
   * @param context.operation - Type of mutation: 'create', 'update', or 'delete'
   * @param context.key - The SWR cache key that was being mutated
   * @param context.data - The data that was being sent (for create/update)
   * @param context.id - The ID of the resource (for update/delete)
   * @param context.timestamp - When the error occurred (milliseconds since epoch)
   * @param originalError - The underlying error that caused the mutation to fail
   *
   * @example
   * throw new MutationError(
   *   'Failed to create todo',
   *   {
   *     operation: 'create',
   *     key: { id: 'todos', data: '/api/todos' },
   *     data: { title: 'New todo' },
   *     timestamp: Date.now()
   *   },
   *   new Error('Network request failed')
   * );
   */
  constructor(
    message: string,
    context: MutationErrorContext,
    originalError: unknown
  ) {
    super(message);
    this.context = context;
    this.originalError = originalError;

    if ("captureStackTrace" in Error) {
      (Error as ErrorConstructorWithStackTrace).captureStackTrace(
        this,
        MutationError
      );
    }
  }

  /**
   * Returns a user-friendly error message suitable for displaying in UI.
   *
   * Converts technical operation names to user-friendly verbs and includes
   * the resource name from the cache key.
   *
   * @returns A formatted error message like "Failed to add todos. Please try again."
   *
   * @example
   * const error = new MutationError(
   *   'Failed to create resource "todos"',
   *   { operation: 'create', key: { id: 'todos' }, timestamp: Date.now() },
   *   originalErr
   * );
   * console.log(error.getUserMessage()); // "Failed to add todos. Please try again."
   */
  getUserMessage(): string {
    const { operation, key } = this.context;
    const resource = key?.id || "resource";

    const operationText = {
      create: "add",
      update: "update",
      delete: "delete",
    }[operation];

    return `Failed to ${operationText} ${resource}. Please try again.`;
  }

  /**
   * Serializes the error to a JSON-compatible object for logging and monitoring.
   *
   * Useful for sending error details to error tracking services like Sentry,
   * LogRocket, or custom logging systems.
   *
   * @returns An object containing all error details including context and original error
   *
   * @example
   * const errorData = mutationError.toJSON();
   * Sentry.captureException(errorData);
   *
   * @example
   * // Returns:
   * // {
   * //   name: 'MutationError',
   * //   message: 'Failed to create resource "todos"',
   * //   context: { operation: 'create', key: {...}, ... },
   * //   originalError: { name: 'Error', message: '...', stack: '...' },
   * //   stack: '...'
   * // }
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      originalError:
        this.originalError instanceof Error
          ? {
              name: this.originalError.name,
              message: this.originalError.message,
              stack: this.originalError.stack,
            }
          : String(this.originalError),
      stack: this.stack,
    };
  }

  /**
   * Determines if the error was caused by network-related issues.
   *
   * Checks the original error's name and message for common network error indicators
   * like 'NetworkError', 'fetch', 'network', or 'timeout'.
   *
   * @returns `true` if the error appears to be network-related, `false` otherwise
   *
   * @example
   * if (error.isNetworkError()) {
   *   // Show retry button
   *   toast.error('Network error. Please try again.', {
   *     action: { label: 'Retry', onClick: handleRetry }
   *   });
   * }
   */
  isNetworkError(): boolean {
    if (this.originalError instanceof Error) {
      const msg = this.originalError.message.toLowerCase();
      return (
        this.originalError.name === "NetworkError" ||
        msg.includes("fetch") ||
        msg.includes("network") ||
        msg.includes("timeout")
      );
    }
    return false;
  }

  /**
   * Determines if the error was caused by validation failures.
   *
   * Checks the original error's message for common validation error indicators
   * like 'validation', 'invalid', or 'required'.
   *
   * @returns `true` if the error appears to be validation-related, `false` otherwise
   *
   * @example
   * if (error.isValidationError()) {
   *   // Show validation message without retry option
   *   toast.error(error.getUserMessage());
   * } else {
   *   // Show generic error with retry
   *   toast.error('Something went wrong', { action: 'Retry' });
   * }
   */
  isValidationError(): boolean {
    if (this.originalError instanceof Error) {
      const msg = this.originalError.message.toLowerCase();
      return (
        msg.includes("validation") ||
        msg.includes("invalid") ||
        msg.includes("required")
      );
    }
    return false;
  }
}
