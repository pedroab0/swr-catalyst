import { renderHook } from "@testing-library/react";
// biome-ignore lint/style/useImportType: React import needed for JSX transform
import React from "react";
import { SWRConfig } from "swr";

import type { Todo } from "../types";

/**
 * Renders a hook with an isolated SWR cache.
 * Use for hook tests where all hooks share the same wrapper context.
 */
export function renderHookWithSWR<T>(hook: () => T) {
  return renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <SWRConfig
        value={{
          dedupingInterval: 0,
          provider: () => new Map(),
        }}
      >
        {children}
      </SWRConfig>
    ),
  });
}

/**
 * Renders a hook using the global SWR cache.
 * Use for utility tests (mutateById, mutateByGroup, resetCache)
 * where utilities operate on the global cache via `import { mutate } from 'swr'`.
 */
export function renderHookWithGlobalCache<T>(hook: () => T) {
  return renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <SWRConfig value={{ dedupingInterval: 0 }}>{children}</SWRConfig>
    ),
  });
}

/**
 * Generates a unique key ID to prevent cache collisions in global cache tests.
 */
export function uniqueKeyId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMockTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    completed: false,
    id: Math.floor(Math.random() * 10_000),
    title: `Test Todo ${Date.now()}`,
    ...overrides,
  };
}
