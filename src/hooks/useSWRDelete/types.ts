/**
 * Function type for deleting a resource via API.
 *
 * @template TResult - The type of data returned from the API (e.g., confirmation message, deleted item)
 *
 * @param id - The unique identifier of the resource to delete
 * @returns Promise resolving to the API response (often a success message or the deleted item)
 *
 * @example
 * // Basic delete function
 * const deleteTodo: DeleteFunction<{ success: boolean }> = async (id) => {
 *   const response = await fetch(`/api/todos/${id}`, {
 *     method: 'DELETE',
 *   });
 *   return response.json();
 * };
 *
 * @example
 * // With axios, returning deleted item
 * const deleteUser: DeleteFunction<User> = async (id) => {
 *   const { data } = await axios.delete(`/api/users/${id}`);
 *   return data;
 * };
 *
 * @example
 * // With error handling
 * const deletePost: DeleteFunction<void> = async (id) => {
 *   const response = await fetch(`/api/posts/${id}`, {
 *     method: 'DELETE',
 *   });
 *   if (!response.ok) {
 *     throw new Error(`Failed to delete: ${response.statusText}`);
 *   }
 * };
 *
 * @example
 * // Returning just status code
 * const deleteComment: DeleteFunction<number> = async (id) => {
 *   const response = await fetch(`/api/comments/${id}`, {
 *     method: 'DELETE',
 *   });
 *   return response.status;
 * };
 */
export type DeleteFunction<TResult> = (id: string | number) => Promise<TResult>;
