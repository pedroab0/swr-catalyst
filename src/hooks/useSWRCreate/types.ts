/**
 * Function type for creating a new resource via API.
 *
 * @template TData - The type of data being sent to create the resource
 * @template TResult - The type of data returned from the API
 *
 * @param data - The data for the new resource
 * @returns Promise resolving to the created resource from the server
 *
 * @example
 * // Basic create function
 * const createTodo: CreateFunction<TodoInput, Todo> = async (data) => {
 *   const response = await fetch('/api/todos', {
 *     method: 'POST',
 *     body: JSON.stringify(data),
 *   });
 *   return response.json();
 * };
 *
 * @example
 * // With axios
 * const createUser: CreateFunction<UserInput, User> = async (data) => {
 *   const { data: user } = await axios.post('/api/users', data);
 *   return user;
 * };
 */
export type CreateFunction<TData, TResult> = (data: TData) => Promise<TResult>;
