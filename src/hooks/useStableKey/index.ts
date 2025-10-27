import { useRef } from "react";

import type { SWRKey } from "@/types";

import { deepEqual } from "./utils";

/**
 * Creates a stable reference for SWR keys to prevent unnecessary re-renders.
 *
 * This hook memoizes the SWR key based on its individual properties (id, group, data)
 * using deep equality comparison. This ensures that the key object remains stable
 * across renders when its properties haven't changed by value, not just by reference.
 *
 * **Key Feature:** Handles object data with deep comparison, so you don't need to
 * wrap complex data in `useMemo` yourself. The hook automatically detects when the
 * actual values change vs when only the object reference changes.
 *
 * @template T - The type of the data property in the SWR key
 *
 * @param key - The SWR key object to stabilize, or null if not ready
 *
 * @returns A memoized SWR key with stable reference, or null if key is null or invalid
 *
 * @example
 * // Works with primitive data (string URLs)
 * const { trigger } = useSWRCreate(
 *   { id: 'todos', data: '/api/todos' },
 *   createTodo
 * );
 *
 * @example
 * // Also works with object data - no useMemo needed!
 * function TodoList({ userId }: { userId: number }) {
 *   const { trigger } = useSWRCreate(
 *     // This is now safe! Hook handles object comparison
 *     { id: 'todos', data: { url: '/api/todos', userId } },
 *     createTodo
 *   );
 * }
 *
 * @example
 * // Stable reference even with dynamic query params
 * function FilteredList({ filter }: { filter: string }) {
 *   const { trigger } = useSWRCreate(
 *     // Hook detects when filter value changes, not just object reference
 *     { id: 'todos', data: { url: '/api/todos', params: { filter } } },
 *     createTodo
 *   );
 * }
 *
 * @remarks
 * - Uses deep equality comparison via JSON serialization for object data
 * - Falls back to reference equality for non-serializable values
 * - Small performance cost (~1ms) for deep comparison on each render
 * - This hook is used internally by all mutation hooks (useSWRCreate, useSWRUpdate, useSWRDelete)
 */
export function useStableKey<T = unknown>(
  key: SWRKey<T> | null
): SWRKey<T> | null {
  const id = key?.id;
  const group = key?.group;
  const data = key?.data;

  const stableKeyRef = useRef<SWRKey<T> | null>(null);

  if (!key) {
    stableKeyRef.current = null;

    return stableKeyRef.current;
  }

  if (!(id && data)) {
    stableKeyRef.current = null;

    return stableKeyRef.current;
  }

  const currentKey = stableKeyRef.current;

  if (
    !currentKey ||
    currentKey.id !== id ||
    currentKey.group !== group ||
    !deepEqual(currentKey.data, data)
  ) {
    stableKeyRef.current = { id, group, data } as SWRKey<T>;
  }

  return stableKeyRef.current;
}
