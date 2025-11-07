# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0]

### Added

- Dependabot configuration for automated dependency updates with weekly checks
- Bundle size monitoring workflow with size-limit-action for PR checks
- Comprehensive CI workflow with parallel jobs for linting, type checking, building, and testing across Node.js 18.x, 20.x, and 22.x
- Codecov integration for test coverage tracking and reporting
- CI and code coverage badges in README
- Bundle size monitoring with size-limit (5 KB limit for bundles, 100 B - 2 KB for individual exports)
- Comprehensive test coverage for `MutationError` class
- Comprehensive test coverage for mutation helpers (`applyOptimisticUpdate`, `createMutationError`, `executeMutation`)
- Edge case test coverage for SWR mutation hooks (unmount scenarios, undefined cache handling, operations without optimistic updates)

### Changed

- Optimized publish workflow with build artifact caching and provenance signing
- Improved build tooling: changed UMD output extension from `.js` to `.cjs` for proper CommonJS module recognition
- Updated `.gitignore` to exclude test coverage artifacts and AI tool directories

### Fixed

- GitHub Packages workflow configuration with improved permissions and authentication

## [0.1.2] - 2025-10-30

### Fixed

- GitHub Packages workflow authentication and npm publish steps
- Package registry configuration and verbose logging

## [0.1.1] - 2025-10-30

### Added

- GitHub Actions workflow for automated publishing to npm and GitHub Packages
- CI/CD pipeline that runs tests before publishing

## [0.1.0] - 2025-10-27

Initial release.

### Added

- `useSWRCreate` hook for creating data with optimistic updates
- `useSWRUpdate` hook for updating data with optimistic updates
- `useSWRDelete` hook for deleting data with optimistic updates
- `mutateById` utility to mutate cache entries by ID
- `mutateByGroup` utility to mutate cache entries by group
- `resetCache` utility to clear cache with optional key preservation
- `MutationError` class with context and helper methods
- `to()` helper for Go-style error handling
- Full TypeScript support with generics
- Comprehensive JSDoc documentation

[Unreleased]: https://github.com/pedroab0/swr-catalyst/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/pedroab0/swr-catalyst/releases/tag/v0.1.2
[0.1.1]: https://github.com/pedroab0/swr-catalyst/releases/tag/v0.1.1
[0.1.0]: https://github.com/pedroab0/swr-catalyst/releases/tag/v0.1.0
