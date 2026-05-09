# pr-visual-diff

[![npm version](https://img.shields.io/npm/v/pr-visual-diff.svg)](https://www.npmjs.com/package/pr-visual-diff)
[![license](https://img.shields.io/npm/l/pr-visual-diff.svg)](https://github.com/abhinav-18max/pr-visual-diff/blob/main/LICENSE)

Local-first visual PR diffs for Next.js and Vite apps.

`pr-visual-diff` compares your current branch against a base branch, captures screenshots across configured routes and viewports, generates pixel diffs, and writes a static HTML report you can inspect locally before pushing.

## What it does

- Uses **temporary Git worktrees** instead of checking out branches in your current working copy.
- Builds and starts the app in **production-like mode** for more stable screenshots.
- Captures **desktop and mobile** screenshots with Playwright.
- Generates `before.png`, `after.png`, `diff.png`, plus a local `report.html`.
- Supports an app-owned **auth/setup hook** for bypass cookies, headers, or deterministic seeding.

## MVP constraints

- Officially supports **Next.js 13+** and **React + Vite**
- Chromium only
- Intended for **10 routes or fewer**
- Best for deterministic routes with limited animation and live data
- No CI, GitHub integration, Storybook, baseline approval flows, or cloud hosting in V1

## Install

```bash
npm install -D pr-visual-diff
```

## Quickstart

1. Initialize config:

```bash
npx pr-visual-diff init
```

2. Edit `.visualdiff.json`:

```json
{
  "baseBranch": "origin/main",
  "framework": "next",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "startCommand": "npm run start",
  "port": 3000,
  "readyUrl": "http://127.0.0.1:3000",
  "outputDir": ".visual-diff",
  "routes": [
    "/",
    { "path": "/dashboard", "expectUrl": "/dashboard" }
  ],
  "viewports": [
    { "name": "desktop", "width": 1440, "height": 900 },
    { "name": "mobile", "width": 390, "height": 844 }
  ],
  "capture": {
    "headless": true,
    "settleMs": 1200,
    "readyTimeoutMs": 60000,
    "disableAnimations": true,
    "maskSelectors": [],
    "headers": {}
  },
  "diff": {
    "threshold": 0.1,
    "failOnChange": false
  },
  "auth": {
    "setupScript": ""
  }
}
```

3. Check your environment:

```bash
npx pr-visual-diff doctor
```

4. Run the comparison:

```bash
npx pr-visual-diff run
```

5. Open `.visual-diff/report.html`.

## CLI

### `init`

Creates `.visualdiff.json` using detected framework defaults.

```bash
npx pr-visual-diff init
```

### `doctor`

Validates local prerequisites and config shape.

```bash
npx pr-visual-diff doctor
```

### `run`

Runs the full branch-to-branch visual comparison.

```bash
npx pr-visual-diff run --base origin/main --routes /,/dashboard --headless --verbose
```

Options:

- `--base <branch>`
- `--routes <csv>`
- `--headless`
- `--no-headless`
- `--verbose`
- `--config <path>`
- `--output <dir>`
- `--fail-on-change`

## Auth/setup hook

If your app needs authenticated screenshots, keep auth policy in the app and use `auth.setupScript` only to activate that app-owned contract. The module should export a default async function that receives:

- `browser`
- `context`
- `page`
- `baseUrl`
- `snapshotDir`
- `worktreeDir`
- `logger`

Example:

```js
import { setVisualDiffBypassCookie } from "pr-visual-diff/auth";

export default async function setup({ page, baseUrl }) {
  await setVisualDiffBypassCookie({
    page,
    baseUrl,
    secret: process.env.VISUAL_DIFF_BYPASS_SECRET
  });
}
```

The setup context storage state is reused for subsequent route captures.

If you prefer headers, set `capture.headers` in `.visualdiff.json`. For the full bypass contract, fixture-mode guidance, and CI setup, see [docs/authenticated-visual-diff.md](./docs/authenticated-visual-diff.md).

## Output

```text
.visual-diff/
  report.html
  manifest.json
  route-slug/
    desktop/
      before.png
      after.png
      diff.png
    mobile/
      before.png
      after.png
      diff.png
```

## Repository layout

```text
packages/
  cli/
  core/
  git/
  runner/
  screenshots/
  diff-engine/
  reporter/
examples/
  nextjs/
  vite-react/
```

## Current limitations

- Expects the target app to live at the repository root
- Assumes one app per repo for V1
- Install/build/start commands run from the repo root
- Dirty tracked working-tree changes block execution

## Development

This repository uses npm workspaces. After installing dependencies:

```bash
npm install
npm test
```
