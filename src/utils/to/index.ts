/**
 * Wraps a promise in a try/catch and returns a tuple of [data, error].
 *
 * This utility provides a clean way to handle async operations without nested try/catch blocks.
 * It follows the Go-style error handling pattern, making error handling more explicit and readable.
 *
 * @template T - The type of data returned by the promise
 *
 * @param promise - The promise to execute and handle
 *
 * @returns A promise that resolves to a tuple:
 *   - On success: `[data, null]` where data is of type T
 *   - On failure: `[null, error]` where error contains the caught exception
 *
 * @example
 * // Basic usage - cleaner than try/catch
 * const [data, error] = await to(fetchTodos());
 * if (error) {
 *   console.error('Failed to fetch:', error);
 *   return;
 * }
 * console.log('Todos:', data);
 *
 * @example
 * // With mutation hooks
 * const { trigger } = useSWRCreate(key, createTodo);
 * const [created, error] = await to(trigger({ title: 'New todo' }));
 * if (error) {
 *   toast.error('Failed to create todo');
 * } else {
 *   toast.success(`Created todo with ID: ${created.id}`);
 * }
 *
 * @example
 * // Multiple operations
 * const [user, userError] = await to(fetchUser(id));
 * const [posts, postsError] = await to(fetchPosts(id));
 *
 * if (userError || postsError) {
 *   // Handle errors
 * }
 *
 * @remarks
 * - Eliminates the need for nested try/catch blocks
 * - Makes error handling more explicit and consistent
 * - Works with any promise, including mutation triggers
 * - Type-safe: TypeScript infers correct types for both data and error
 */
export async function to<T>(
  promise: Promise<T>
): Promise<[T | null, unknown | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error];
  }
}
