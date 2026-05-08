# Architecture

`pr-visual-diff` is split into small workspace packages:

- `cli`: command parsing and user-facing orchestration
- `core`: config loading, validation, shared utilities, logging, errors
- `git`: temp worktree preparation and cleanup
- `runner`: dependency install, build, app start, readiness checks, shutdown
- `screenshots`: Playwright capture plus auth/setup hook execution
- `diff-engine`: image normalization and pixel diff generation
- `reporter`: manifest and static HTML report generation

Execution flow:

1. Load config and resolve CLI overrides.
2. Create temp worktrees for base and head refs.
3. Build/start base worktree and capture screenshots.
4. Build/start head worktree and capture screenshots.
5. Generate pixel diffs and assemble final assets.
6. Write `manifest.json` and `report.html`.
7. Clean up child processes and worktrees.
