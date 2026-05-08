# Demo App

This demo is a guided playground for `swr-catalyst` with in-screen comments, a dark UI, and event instrumentation.

## What it demonstrates

- Mutation hooks: `useSWRCreate`, `useSWRUpdate`, `useSWRDelete`
- Optimistic updates + rollback behavior
- `MutationError` helpers (`getUserMessage`, `isNetworkError`, `isValidationError`, `toJSON`)
- Cache utilities: `mutateById`, `mutateByGroup`, `resetCache`
- Utility helpers: `swrMutate`, `swrGetCache`, `extractSWRKey`, `to`
- `useStableKey` behavior
- Action timeline with replay and cache diff inspection
- Scenario presets and runtime data mode switching (`inMemory` or `msw`)

## Architecture

The demo app follows a feature-based folder structure to ensure maintainability and scalability:

- **`src/features/`**: Domain-specific modules containing their own components, hooks, and tests.
  - `todos`: CRUD logic and UI.
  - `scenario`: Scenario presets and failure mode state.
  - `timeline`: Event tracking and replay.
  - `cache`: Cache viewing and diffing.
  - `core`: Shared layout components (header, toasts, overlays).
- **`src/hooks/useAppController.ts`**: A central orchestration hook that manages the unified event reporting and global state transitions.
- **Path Aliases**: Uses the `@demo/` alias for clean, absolute imports within the demo source.

## Start

From repository root:

```bash
npm run demo:dev
```

Build and preview:

```bash
npm run demo:build
npm run demo:preview
```

## Testing

The demo app includes two layers of testing:

### 1. Integration Tests (Vitest)
Feature-specific integration tests located within `src/features/**/__tests__`. These tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) to verify domain logic in isolation.

Run integration tests from the root:
```bash
npx vitest run examples/demo
```

### 2. End-to-End Tests (Playwright)
A comprehensive E2E suite powered by [Playwright](https://playwright.dev/). These tests cover 100% of the demo's features across Chromium, Firefox, and WebKit, including visual regression and accessibility checks.

Run all E2E tests from the root:
```bash
npm run demo:test
```

Open the interactive UI mode for debugging:
```bash
npm run demo:test:ui
```

Update local visual regression baseline screenshots:
```bash
npm run demo:test:update
```

## Maintaining Visual Snapshots

Visual regression tests are notoriously sensitive to OS-level rendering differences (fonts, antialiasing). To keep the CI green while allowing fast local development, Playwright uses platform-specific snapshots:

- **Mac (`-darwin.png`)**: Used when running `npm run demo:test` locally.
- **Linux (`-linux.png`)**: Used in GitHub Actions.

### Updating Snapshots

When you intentionally change the UI, you need to update both sets of images:

1.  **Local (Mac):** Run `npm run demo:test:update`.
2.  **CI (Linux):** 
    - Push your changes and let the CI fail.
    - Download the `playwright-report` from the failed GitHub Action.
    - Copy the "Actual" images into the snapshots folder (ensure they end in `-linux.png`).

**Note:** Running the Mac tests will *not* overwrite the Linux files, and vice versa. You should commit both sets of files to the repository. This ensures that the CI environment remains the source of truth for Linux rendering.

## Guided walkthrough

1. Keep `Happy path` preset and run create/rename/toggle/delete in **Hooks Demo**.
2. Set `Delay (ms)` to `1000+` to visualize `isMutating` and optimistic rows.
3. Apply `Validation errors` to inspect **MutationError Inspector**.
4. Use `Network slow` to test loading states under latency (no forced failures).
5. In **Utilities Demo**, set target ids/groups and run utility actions.
6. Open **Action Timeline** and select `Show cache diff` on any event.
7. Use **Replay** on safe actions to rerun the same operation.
8. Use **Reset demo state** to return todos/scenario/cache to baseline.

## Data modes

- `inMemory`: calls in-memory API functions directly
- `msw`: uses `fetch` against MSW handlers (`/api/*`)

If service workers are unavailable, the app falls back to `inMemory` and shows a warning toast.

## Troubleshooting

- If cache output is empty, run one fetch/mutation and click `swrGetCache read`.
- If `msw` mode cannot start, keep `inMemory` mode (fully supported in tests).
- If timeline is empty, run one action in Hooks or Utilities first.
