import type { Arguments } from "swr";

import type { SWRKey } from "@/types";

const ID_PATTERN = /#id:"((?:[^"\\]|\\.)*)"/;
const GROUP_PATTERN = /group:"((?:[^"\\]|\\.)*)"/;
const DATA_PATTERN = /data:"((?:[^"\\]|\\.)*)"/;

/**
 * Unescapes a string by removing backslash escape sequences.
 * Converts \", \n, \t, etc. back to their original characters.
 *
 * @param str - The escaped string
 * @returns The unescaped string
 *
 * @example
 * unescapeString('user\\"admin') // Returns: user"admin
 * unescapeString('multi\\nline') // Returns: multi\nline
 */
function unescapeString(str: string): string {
  return str.replace(/\\(.)/g, "$1");
}

/**
 * Attempts to parse a cache key using the current SWR serialization format.
 * Uses improved regex patterns that handle escaped quotes and special characters.
 *
 * @param key - The serialized cache key string
 * @returns Parsed SWRKey object or null if parsing fails
 *
 * @example
 * tryCurrentFormat('#id:"todos",data:"/api/todos"')
 * // Returns: { id: 'todos', data: '/api/todos' }
 */
function tryCurrentFormat(key: string): SWRKey | null {
  if (!key.startsWith("#id:")) {
    return null;
  }

  const idMatch = key.match(ID_PATTERN);
  if (!idMatch) {
    return null;
  }

  const groupMatch = key.match(GROUP_PATTERN);
  const dataMatch = key.match(DATA_PATTERN);

  return {
    id: unescapeString(idMatch[1]),
    group: groupMatch ? unescapeString(groupMatch[1]) : undefined,
    data: dataMatch ? unescapeString(dataMatch[1]) : undefined,
  };
}

/**
 * Attempts to parse a cache key as JSON.
 * This is a fallback strategy for future SWR versions that might use JSON serialization.
 *
 * @param key - The serialized cache key string
 * @returns Parsed SWRKey object or null if not valid JSON or missing required fields
 *
 * @example
 * tryJSONFormat('{"id":"todos","data":"/api/todos"}')
 * // Returns: { id: 'todos', data: '/api/todos' }
 */
function tryJSONFormat(key: string): SWRKey | null {
  try {
    const parsed = JSON.parse(key);
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      return parsed as SWRKey;
    }
  } catch {
    // Not valid JSON, return null
  }
  return null;
}

/**
 * Safely extracts a typed SWRKey object from any SWR cache key.
 *
 * This function uses multiple parsing strategies to handle different serialization formats:
 * 1. **Direct object check**: If the key is already a SWRKey object, return it
 * 2. **Current SWR format**: Parse using improved regex that handles escaped quotes and special characters
 * 3. **JSON parsing**: Fallback for future SWR versions that might use JSON serialization
 *
 * The improved regex handles edge cases like:
 * - Quotes in values: `{ id: 'user"admin' }`
 * - Escaped characters: `\n`, `\t`, `\"`
 * - Unicode characters: Chinese, Arabic, emoji, etc.
 * - Complex query strings: `/api/todos?filter="active"`
 *
 * @param cacheKey - The SWR cache key to extract from (can be object or serialized string)
 * @returns Parsed SWRKey object or null if extraction fails
 *
 * @example
 * // Direct object
 * extractSWRKey({ id: 'todos', data: '/api/todos' })
 * // Returns: { id: 'todos', data: '/api/todos' }
 *
 * @example
 * // Serialized with quotes
 * extractSWRKey('#id:"user\\"admin",data:"/api/users"')
 * // Returns: { id: 'user"admin', data: '/api/users' }
 *
 * @example
 * // JSON format (future-proofing)
 * extractSWRKey('{"id":"todos","data":"/api/todos"}')
 * // Returns: { id: 'todos', data: '/api/todos' }
 *
 * @remarks
 * This function relies on SWR's internal serialization format which may change.
 * Multiple fallback strategies make it resilient to format changes.
 * If all strategies fail, returns null gracefully.
 */
export function extractSWRKey(cacheKey: Arguments): SWRKey | null {
  if (typeof cacheKey === "object" && cacheKey !== null && "id" in cacheKey) {
    return cacheKey as SWRKey;
  }

  if (typeof cacheKey !== "string") {
    return null;
  }

  const currentFormat = tryCurrentFormat(cacheKey);
  if (currentFormat) {
    return currentFormat;
  }

  const jsonFormat = tryJSONFormat(cacheKey);
  if (jsonFormat) {
    return jsonFormat;
  }

  return null;
}
