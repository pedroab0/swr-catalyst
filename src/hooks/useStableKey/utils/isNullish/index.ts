/**
 * Type guard that checks if a value is null or undefined.
 *
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export const isNullish = (value: unknown): value is null | undefined =>
  value === null || value === undefined;
