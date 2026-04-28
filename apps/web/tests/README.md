# Frontend Tests

`apps/web/src` is reserved for runtime application code. Keep Vitest coverage in this tree so page, library, and feature files stay easy to scan.

- `unit/`: jsdom unit and component tests run by `pnpm test:run`.
- `integration/`: node-based Vitest integration tests run by `pnpm test:integration`.
- `setup.ts`: shared jsdom setup loaded by the unit Vitest config.

Playwright browser coverage remains in `apps/web/e2e`.
