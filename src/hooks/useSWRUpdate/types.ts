/**
 * Function type for updating an existing resource via API.
 *
 * @template TData - The type of data being sent to update the resource
 * @template TResult - The type of data returned from the API
 *
 * @param id - The unique identifier of the resource to update
 * @param data - The partial or complete data to update the resource with
 * @returns Promise resolving to the updated resource from the server
 *
 * @example
 * // Basic update function with PATCH
 * const updateTodo: UpdateFunction<TodoUpdate, Todo> = async (id, data) => {
 *   const response = await fetch(`/api/todos/${id}`, {
 *     method: 'PATCH',
 *     body: JSON.stringify(data),
 *   });
 *   return response.json();
 * };
 *
 * @example
 * // With axios and PUT
 * const updateUser: UpdateFunction<UserUpdate, User> = async (id, data) => {
 *   const { data: user } = await axios.put(`/api/users/${id}`, data);
 *   return user;
 * };
 *
 * @example
 * // With error handling
 * const updatePost: UpdateFunction<PostUpdate, Post> = async (id, data) => {
 *   const response = await fetch(`/api/posts/${id}`, {
 *     method: 'PATCH',
 *     body: JSON.stringify(data),
 *   });
 *   if (!response.ok) {
 *     throw new Error(`Failed to update post: ${response.statusText}`);
 *   }
 *   return response.json();
 * };
 */
export type UpdateFunction<TData, TResult> = (
  id: string | number,
  data: TData
) => Promise<TResult>;
