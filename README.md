# swr-catalyst

<div align="center">

**A lightweight, type-safe library for effortless data mutations with SWR**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/swr-catalyst)](https://bundlephobia.com/package/swr-catalyst)
[![npm version](https://badge.fury.io/js/swr-catalyst.svg)](https://www.npmjs.com/package/swr-catalyst)
[![npm downloads](https://img.shields.io/npm/dm/swr-catalyst.svg)](https://www.npmjs.com/package/swr-catalyst)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [API Reference](#api-reference)

</div>

---

## Why swr-catalyst?

SWR excels at data fetching, but mutations (create, update, delete) require significant boilerplate—especially with optimistic updates. **swr-catalyst** eliminates this repetition with declarative hooks that handle:

- ✅ **Optimistic UI updates** with automatic rollback
- ✅ **Loading and error states** out of the box
- ✅ **Type-safe mutations** with full TypeScript support
- ✅ **Advanced cache management** utilities
- ✅ **Zero configuration** required

## Features

- 🎯 **Three core hooks**: `useSWRCreate`, `useSWRUpdate`, `useSWRDelete`
- 🚀 **Optimistic updates**: Instant UI feedback with automatic error rollback
- 📦 **Tiny footprint**: ~3KB minified + gzipped
- 🔒 **Type-safe**: Full TypeScript support with generics
- 🛠️ **Cache utilities**: Batch operations with `mutateById`, `mutateByGroup`, `resetCache`
- 🔑 **Structured keys**: Uses typed `SWRKey` objects for enhanced cache management
- ⚡ **Smart error handling**: Custom `MutationError` class with helpful context

## Installation

```bash
npm install swr-catalyst
```

```bash
pnpm add swr-catalyst
```

```bash
yarn add swr-catalyst
```

> **Note:** This library requires `react` and `swr` as peer dependencies. Make sure you have them installed in your project.

## Quick Start

### Basic CRUD Operations

```tsx
import { useSWRCreate, useSWRUpdate, useSWRDelete } from 'swr-catalyst';

// Create
const { trigger: createTodo, isMutating, error } = useSWRCreate(
  { id: 'todos', data: '/api/todos' },
  async (newTodo) => api.post('/todos', newTodo)
);

await createTodo({ title: 'Buy milk' });

// Update
const { trigger: updateTodo } = useSWRUpdate(
  { id: 'todos', data: '/api/todos' },
  async (id, data) => api.patch(`/todos/${id}`, data)
);

await updateTodo(1, { completed: true });

// Delete
const { trigger: deleteTodo } = useSWRDelete(
  { id: 'todos', data: '/api/todos' },
  async (id) => api.delete(`/todos/${id}`)
);

await deleteTodo(1);
```

### Optimistic Updates

Make your UI feel instant with optimistic updates:

```tsx
import { useSWRCreate } from 'swr-catalyst';

const { trigger: addTodo } = useSWRCreate(
  { id: 'todos', data: '/api/todos' },
  createTodoAPI,
  {
    optimisticUpdate: (currentTodos, newTodo) => [
      ...(currentTodos || []),
      { ...newTodo, id: `temp-${Date.now()}` }
    ],
    rollbackOnError: true // Automatically reverts on failure
  }
);

// UI updates immediately, syncs with server in background
await addTodo({ title: 'New task' });
```

### Loading and Error States

```tsx
import { useSWRCreate } from 'swr-catalyst';

function AddTodoForm() {
  const { trigger: addTodo, isMutating, error } = useSWRCreate(
    { id: 'todos', data: '/api/todos' },
    createTodoAPI
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await addTodo({ title: formData.get('title') });
      e.currentTarget.reset();
    } catch (err) {
      // Error state is automatically updated
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" type="text" disabled={isMutating} />
      <button type="submit" disabled={isMutating}>
        {isMutating ? 'Adding...' : 'Add Todo'}
      </button>
      {error && <p className="error">Failed to add todo: {error.message}</p>}
    </form>
  );
}
```

### Error Handling

All hooks return a custom `MutationError` when mutations fail. This error class provides rich context and helpful methods for handling failures gracefully.

#### Properties

- `name`: Always `"MutationError"`
- `message`: Human-readable error description
- `context`: Object containing mutation details:
  - `operation`: The type of mutation (`"create"`, `"update"`, or `"delete"`)
  - `key`: The `SWRKey` that was being mutated
  - `data`: The payload data (for create/update operations)
  - `id`: The resource ID (for update/delete operations)
  - `timestamp`: When the error occurred (milliseconds since epoch)
- `originalError`: The underlying error that caused the failure
- `stack`: Error stack trace

#### Methods

**`getUserMessage(): string`**

Returns a user-friendly error message suitable for displaying in UI.

```typescript
const error = mutationError.getUserMessage();
// Returns: "Failed to add todos. Please try again."
```

**`isNetworkError(): boolean`**

Checks if the error was caused by network-related issues (connection failures, timeouts, etc.).

```typescript
if (error.isNetworkError()) {
  toast.error('Network error. Check your connection and try again.', {
    action: { label: 'Retry', onClick: handleRetry }
  });
}
```

**`isValidationError(): boolean`**

Checks if the error was caused by validation failures (invalid data, required fields, etc.).

```typescript
if (error.isValidationError()) {
  // Show validation-specific message
  toast.error('Please check your input and try again.');
} else {
  // Show generic error with retry option
  toast.error('Something went wrong', { action: 'Retry' });
}
```

**`toJSON(): object`**

Serializes the error to a JSON-compatible object for logging and error tracking services.

```typescript
// Send to error tracking service
Sentry.captureException(mutationError.toJSON());

// Log for debugging
console.error('Mutation failed:', mutationError.toJSON());
```

#### Complete Example

```typescript
import { useSWRCreate, MutationError } from 'swr-catalyst';

function TodoForm() {
  const { trigger, error } = useSWRCreate(
    { id: 'todos', data: '/api/todos' },
    createTodoAPI
  );

  const handleSubmit = async (data) => {
    try {
      await trigger(data);
    } catch (err) {
      if (err instanceof MutationError) {
        // Use helper methods for better UX
        if (err.isNetworkError()) {
          toast.error('Network error. Please check your connection.');
        } else if (err.isValidationError()) {
          toast.error(err.getUserMessage());
        } else {
          // Generic error handling
          toast.error('Something went wrong. Please try again.');
        }
        
        // Log detailed error for debugging
        console.error('Mutation context:', err.context);
        console.error('Original error:', err.originalError);
      }
    }
  };

  // Or use the error state directly
  if (error) {
    return <Alert>{error.getUserMessage()}</Alert>;
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Key Structure

**Important:** swr-catalyst requires a specific key structure for all hooks and utilities to work properly.

### SWRKey Type

```typescript
type SWRKey<T = unknown> = {
  id: string;      // Required: Unique identifier for the cache entry
  group?: string;  // Optional: Group name for batch operations
  data: T;         // Required: The actual SWR key (URL, array, etc.)
} | null;
```

### Why Structured Keys?

The structured key format enables powerful cache management features:

- **`id`**: Allows `mutateById()` to update specific cache entries
- **`group`**: Enables `mutateByGroup()` to batch-update related caches
- **`data`**: The actual key passed to SWR's fetcher function

## Key Management

The library handles key stability internally using deep equality comparison, so you don't need to wrap the key object yourself. The `useStableKey` hook automatically detects when values change, even for complex nested objects.

```typescript
// ✅ Simple primitive value for data
const { trigger: createTodo } = useSWRCreate(
  { id: 'todos', data: '/api/todos' },
  createTodoAPI
);

// ✅ Complex object data - no useMemo needed!
// The library handles deep equality automatically
const { trigger: createTodo } = useSWRCreate(
  { id: 'todos', data: { url: '/api/todos', userId: user.id } },
  createTodoAPI
);

// ✅ Even deeply nested objects work automatically
const { trigger: createTodo } = useSWRCreate(
  { 
    id: 'todos', 
    data: { 
      url: '/api/todos', 
      params: { userId: user.id, filter: 'active' } 
    } 
  },
  createTodoAPI
);
```

## API Reference

This library exports a set of hooks and utility functions to streamline your data mutation workflow.

### Hooks

#### `useSWRCreate(key, createFunction, options)`

A hook for creating new data. It handles optimistic updates, loading states, and revalidates the cache upon success.

*   **`key`**: A `SWRKey` object that will be revalidated after creation.
*   **`createFunction`**: An async function `(data) => Promise<NewData>` that performs the API call.
*   **`options`** (optional): Configuration for optimistic updates (`optimisticUpdate`, `rollbackOnError`).

**Returns:** `{ trigger, isMutating, error }`

#### `useSWRUpdate(key, updateFunction, options)`

A hook for updating existing data.

*   **`key`**: A `SWRKey` object that will be revalidated after the update.
*   **`updateFunction`**: An async function `(id, data) => Promise<UpdatedData>` that performs the API call.
*   **`options`** (optional): Configuration for optimistic updates.

**Returns:** `{ trigger, isMutating, error }`

#### `useSWRDelete(key, deleteFunction, options)`

A hook for deleting data.

*   **`key`**: A `SWRKey` object that will be revalidated after deletion.
*   **`deleteFunction`**: An async function `(id) => Promise<void>` that performs the API call.
*   **`options`** (optional): Configuration for optimistic updates.

**Returns:** `{ trigger, isMutating, error }`

#### `useStableKey(key)`

A utility hook that memoizes an `SWRKey` using deep equality comparison. This prevents unnecessary re-renders in child components when a key's object reference changes but its values do not. It is used internally by all mutation hooks.

*   **`key`**: The `SWRKey` object to stabilize.

**Returns:** A memoized `SWRKey` with a stable reference.

### Utilities

#### `mutateById(ids, newData, options)`

Mutates all SWR cache entries whose key `id` matches one or more provided IDs.

*   **`ids`**: A single ID string or an array of IDs.
*   **`newData`** (optional): The new data to set for the matched keys. If omitted, matching keys are revalidated.
*   **`options`** (optional): SWR mutator options (`revalidate`, `populateCache`, etc.).

**Example:**
```typescript
// Revalidate all caches related to 'user' and 'profile'
await mutateById(['user', 'profile']);
```

#### `mutateByGroup(groups, newData, options)`

Mutates all SWR cache entries whose key `group` matches one or more provided group names.

*   **`groups`**: A single group string or an array of groups.
*   **`newData`** (optional): The new data to set for the matched keys. If omitted, matching keys are revalidated.
*   **`options`** (optional): SWR mutator options.

**Example:**
```typescript
// Update all caches in the 'user-data' group without revalidating
await mutateByGroup('user-data', updatedData, { revalidate: false });
```

#### `resetCache(preservedKeys)`

Clears the entire SWR cache, with an option to preserve specific entries by their `id`.

*   **`preservedKeys`** (optional): A single ID string or an array of IDs to exclude from the reset.

**Example:**
```typescript
// On logout, clear all data except for public content
await resetCache(['public-posts', 'app-config']);
```

#### `to(promise)`

Wraps any promise and converts it into a `[data, error]` tuple, inspired by Go's error handling style. This avoids `try/catch` blocks for cleaner async code.

*   **Returns:** A promise that always resolves with `[data, null]` on success or `[null, error]` on failure.

**Example:**
```tsx
import { to } from 'swr-catalyst';

const [result, error] = await to(createTodo({ title: 'New item' }));

if (error) {
  console.error('Mutation failed:', error);
}
```

#### `swrMutate(mutate, key, data, shouldRevalidate)`

A type-safe wrapper around SWR's `mutate` function that correctly handles the structured `SWRKey` object.

*   **`mutate`**: The `mutate` function from `useSWRConfig()`.
*   **`key`**: The `SWRKey` to mutate.
*   **`data`** (optional): The new data to update the cache with.
*   **`shouldRevalidate`** (optional): Whether to revalidate after mutation.

**Example:**
```typescript
// Perform an optimistic update without revalidation
await swrMutate(mutate, key, optimisticData, false);
```

#### `swrGetCache(cache, key)`

A type-safe wrapper around SWR's `cache.get()` method that correctly handles the structured `SWRKey` object.

*   **`cache`**: The `cache` object from `useSWRConfig()`.
*   **`key`**: The `SWRKey` to look up.

**Returns:** The cached data or `undefined`.

**Example:**
```typescript
const { cache } = useSWRConfig();
const cachedTodos = swrGetCache(cache, { id: 'todos', data: '/api/todos' });
```

## Bundle Size

| Package | Minified | Minified + Gzipped |
|---------|----------|-------------------|
| swr-catalyst | ~11.7KB | ~3.2KB |

Zero dependencies beyond peer dependencies (`react` and `swr`).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Pedro Barbosa](https://github.com/pedroab0)

---

<div align="center">
Made with ❤️ for the SWR community
</div>
