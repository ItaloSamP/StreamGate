# Frontend Test Structure Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move frontend unit and integration tests out of `apps/web/src` into a dedicated `apps/web/tests` tree without changing runtime architecture.

**Architecture:** Keep `apps/web/src` as runtime-only code and place Vitest files under `apps/web/tests/unit` and `apps/web/tests/integration`. Preserve `apps/web/e2e` for Playwright and keep Rails/Worker test structures unchanged because they already follow framework conventions.

**Tech Stack:** React, Vite, Vitest, TypeScript path alias `@/*`, Rails Minitest, Worker RSpec.

---

### Task 1: Move Frontend Test Files

**Files:**
- Move: `apps/web/src/test/setup.ts` to `apps/web/tests/setup.ts`
- Move: `apps/web/src/lib/*.test.ts` to `apps/web/tests/unit/lib/*.test.ts`
- Move: `apps/web/src/lib/*.integration.test.ts` to `apps/web/tests/integration/lib/*.integration.test.ts`
- Move: `apps/web/src/pages/*.test.tsx` to `apps/web/tests/unit/pages/*.test.tsx`
- Move: `apps/web/src/features/auth/protected-route.test.tsx` to `apps/web/tests/unit/features/auth/protected-route.test.tsx`

- [x] **Step 1: Create target folders**

Run:

```powershell
New-Item -ItemType Directory -Force apps/web/tests/unit/lib, apps/web/tests/unit/pages, apps/web/tests/unit/features/auth, apps/web/tests/integration/lib
```

- [x] **Step 2: Move files without changing production code**

Run `Move-Item` for each test file into the matching target folder.

- [x] **Step 3: Verify no test files remain in `src`**

Run:

```powershell
rg --files apps/web/src | Select-String -Pattern '\.(test|integration\.test)\.(ts|tsx)$'
```

Expected: no output.

### Task 2: Update Test Imports And Vitest Config

**Files:**
- Modify: `apps/web/vitest.config.ts`
- Modify: `apps/web/vitest.integration.config.ts`
- Modify: moved files under `apps/web/tests`

- [x] **Step 1: Update Vitest setup and include globs**

`apps/web/vitest.config.ts` should use:

```ts
setupFiles: ['./tests/setup.ts'],
include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
exclude: [...configDefaults.exclude, 'tests/integration/**/*.integration.test.ts'],
```

`apps/web/vitest.integration.config.ts` should use:

```ts
include: ['tests/integration/**/*.integration.test.ts'],
```

- [x] **Step 2: Convert relative imports to `@/` aliases**

Moved tests should import runtime code through `@/lib/...`, `@/pages/...`, `@/features/...`, and `@/components/...` instead of deep relative paths.

- [x] **Step 3: Run focused frontend tests**

Run:

```powershell
pnpm.cmd --dir apps/web test:run
```

Expected: exit code 0.

### Task 3: Document The Structure

**Files:**
- Create: `apps/web/tests/README.md`
- Modify: `apps/web/README.md`
- Modify: `docs/guides/frontend/frontend-foundations.md`

- [x] **Step 1: Add test tree README**

Document that `src` is runtime code, `tests/unit` is Vitest unit/component coverage, `tests/integration` is Vitest integration coverage, and `e2e` remains Playwright.

- [x] **Step 2: Update frontend docs**

Mention the new convention so future tests do not drift back into `src`.

- [x] **Step 3: Run validation**

Run:

```powershell
pnpm.cmd --dir apps/web test:run
pnpm.cmd --dir apps/web test:integration
pnpm.cmd --dir apps/web build
```

Expected: all exit code 0.

### Task 4: Final Repository Check

**Files:**
- Read-only verification across repo.

- [x] **Step 1: Check status and diff**

Run:

```powershell
git status --short
git diff --check
```

Expected: only intentional moves/docs/config changes and no whitespace errors.

- [x] **Step 2: Report outcome**

Summarize moved folders, validation commands, and any remaining structural debt intentionally left untouched.
