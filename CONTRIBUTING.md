# Contributing to swr-catalyst

First off, thank you for considering contributing! It's people like you that make open source such a great community.

## Getting Started

1.  **Fork the repository** and clone it to your local machine.
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the tests** to make sure everything is set up correctly:
    ```bash
    npm test
    ```

## Making Changes

1.  Create a new branch for your feature or bug fix.
2.  Make your changes. Please make sure to add or update tests as appropriate.
3.  Ensure all tests pass before submitting your change.

## Testing

This project uses Vitest and Playwright for testing with three types of tests:

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run all tests with coverage report |
| `npm run demo:dev` | Run the demo app locally |
| `npm run demo:test` | Run E2E tests for the demo |
| `npm run demo:test:ui` | Run E2E tests in interactive UI mode |
| `npm run demo:test:update` | Update baseline screenshots for visual regression |

### Unit Tests

Unit tests are **collocated** with their source files:

```
src/
├── hooks/
│   └── useSWRCreate/
│       ├── index.ts        # Source
│       └── index.test.ts   # Unit test
├── utils/
│   └── mutateById/
│       ├── index.ts        # Source
│       └── index.test.ts   # Unit test
```

**Guidelines:**
- Test individual functions/hooks in isolation
- Mock external dependencies (SWR, fetch, etc.)
- Focus on edge cases and error handling
- Keep tests fast and deterministic

### Integration Tests

Integration tests live in a dedicated folder and test real interactions:

```
src/__tests__/integration/
├── errors/           # Test error classes
├── types/            # Shared test types
├── helpers/          # Test utilities and fetchers
├── setup/            # MSW server and Vitest setup
├── hooks/            # Hook integration tests
├── utilities/        # Utility integration tests
└── scenarios/        # Complex scenario tests
```

**Guidelines:**
- Use MSW (Mock Service Worker) to mock API responses
- Test real SWR cache behavior (no mocking SWR)
- Use `renderHookWithSWR` for isolated cache per test
- Use `renderHookWithGlobalCache` for utility tests
- Test error recovery, optimistic updates, and cache consistency

### End-to-End (E2E) Tests

We use [Playwright](https://playwright.dev/) to test the demo application in real browsers (Chromium, Firefox, and WebKit). These tests ensure that the library integrates correctly within a React application and that the user interface behaves as expected.

**Features tested:**
- Full CRUD lifecycle with optimistic updates
- Error handling and visual feedback
- Cache utility interactions
- Accessibility (via `axe-core`)
- Visual regression (screenshot comparison)

Run E2E tests locally:
```bash
npm run demo:test
```

### Writing Integration Tests

```typescript
import { renderHookWithSWR, fetchTodos } from "../helpers";

it("should fetch and cache data", async () => {
  const { result } = renderHookWithSWR(() =>
    useSWR(todosKey, fetchTodos)
  );

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });

  expect(result.current.data).toHaveLength(2);
});
```

### Test Coverage

We aim for high test coverage. Run `npm run test:coverage` to generate a coverage report. The CI pipeline uploads coverage to [Codecov](https://codecov.io/).

## Submitting a Pull Request

1.  Push your changes to your fork.
2.  Open a pull request to the `main` branch of the original repository.
3.  Provide a clear description of the problem and solution in your pull request. Include the relevant issue number if applicable.
4.  Ensure all CI checks pass (lint, typecheck, build, tests).

Thank you for your contribution!
