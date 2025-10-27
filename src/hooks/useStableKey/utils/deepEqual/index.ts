/**
 * Performs a deep equality check between two values.
 *
 * Uses JSON serialization for comparison, which works for most SWR key scenarios.
 * Falls back to reference equality for non-serializable values.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal, false otherwise
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (a == null || b == null) {
    return a === b;
  }

  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}