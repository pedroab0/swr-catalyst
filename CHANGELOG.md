# Changelog

All notable changes to this project will be documented in this file.

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

[0.1.1]: https://github.com/pedroab0/swr-catalyst/releases/tag/v0.1.1
[0.1.0]: https://github.com/pedroab0/swr-catalyst/releases/tag/v0.1.0
