# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install all workspace dependencies
npm test             # run all tests
```

Run a single test file:
```bash
node --test packages/core/src/utils.test.js
```

Run the CLI locally:
```bash
node packages/cli/src/bin.js run
node packages/cli/src/bin.js init
node packages/cli/src/bin.js doctor
```

## Architecture

This is an **npm workspaces monorepo** (`"type": "module"` — pure ESM throughout). The published package is `pr-visual-diff` (`packages/cli`); all other packages are internal workspace dependencies.

### Package roles

| Package | Responsibility |
|---|---|
| `cli` | Command parsing (`args.js`), user-facing orchestration (`run.js`, `init.js`, `doctor.js`) |
| `core` | Config loading/validation/merging, constants, `VisualDiffError`, logger, fs helpers, utils |
| `git` | Git worktree creation and cleanup via `git worktree add --detach` |
| `runner` | Install, build, `start` the app in a worktree; poll readiness |
| `screenshots` | Playwright capture + auth/setup hook execution |
| `diff-engine` | Image normalization and pixel diff via `pixelmatch` + `pngjs` |
| `reporter` | Write `manifest.json` and the static `report.html` |

### Execution flow (`packages/cli/src/run.js`)

1. Load and validate `.visualdiff.json`, merge CLI overrides (`core`)
2. Assert clean tracked working tree; create temp worktrees for base ref and HEAD (`git`)
3. Install → build → start base worktree app; capture screenshots (`runner`, `screenshots`)
4. Same for head worktree
5. Generate pixel diffs for every route×viewport pair (`diff-engine`)
6. Write `manifest.json` + `report.html` to output dir (`reporter`)
7. Cleanup worktrees in `finally`

### Key conventions

- **Errors**: always throw `VisualDiffError` with a `code` string (defined in `packages/core/src/errors.js`). Codes: `CONFIG_NOT_FOUND`, `INVALID_CONFIG`, `DIRTY_WORKTREE`, `GIT_COMMAND_FAILED`, `ROUTE_LIMIT`, etc.
- **Tests**: Node built-in test runner (`node:test` + `node:assert/strict`). No jest/vitest.
- **Config file**: `.visualdiff.json` at the user's project root. Shape is defined and defaulted in `packages/core/src/config.js` and `packages/core/src/constants.js`.
- **Supported frameworks**: `"next"` (port 3000) and `"vite"` (port 4173, uses `vite preview`).
- **MVP constraint**: max 10 routes (`DEFAULT_MAX_ROUTES`); expects app at repo root; dirty tracked files block execution.
