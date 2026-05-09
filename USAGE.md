# Using pr-visual-diff in a New Frontend Project

`pr-visual-diff` catches unintended UI regressions before you push. It checks out your base branch and your current branch into temporary Git worktrees, builds and starts both, captures full-page screenshots of every route you configure, and generates a pixel-level diff. The result is a self-contained `report.html` you open in your browser to see exactly what changed visually.

---

## Table of contents

1. [How it works](#how-it-works)
2. [Prerequisites](#prerequisites)
3. [Install](#install)
4. [Project setup — Next.js](#project-setup--nextjs)
5. [Project setup — Vite + React](#project-setup--vite--react)
6. [Initialize the config](#initialize-the-config)
7. [Run the doctor check](#run-the-doctor-check)
8. [Run your first diff](#run-your-first-diff)
9. [Configuration reference](#configuration-reference)
10. [CLI reference](#cli-reference)
11. [Auth and setup hooks](#auth-and-setup-hooks)
12. [Masking dynamic content](#masking-dynamic-content)
13. [Understanding the output](#understanding-the-output)
14. [Integrating into your workflow](#integrating-into-your-workflow)
15. [Troubleshooting](#troubleshooting)

---

## How it works

```
your branch ──┐
              ├─▶ build both ──▶ screenshot all routes ──▶ pixel diff ──▶ report.html
base branch ──┘
```

1. Both branches are checked out into separate temp directories using `git worktree` — your working copy is never touched.
2. Each worktree gets a fresh `install → build → start` cycle.
3. Playwright captures full-page screenshots for every `route × viewport` combination.
4. `pixelmatch` compares the before/after images and writes a `diff.png` highlighting changed pixels.
5. A static `report.html` is written to `.visual-diff/` — open it in any browser.

Everything runs locally. Nothing leaves your machine.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 18+** | The tool uses the Node built-in fetch API |
| **Git 2.5+** | `git worktree` support required |
| **Chromium** | Installed via Playwright (see below) |
| **Clean tracked state** | Uncommitted changes to tracked files will block the run — commit or stash first |

---

## Install

```bash
# npm
npm install -D pr-visual-diff

# pnpm
pnpm add -D pr-visual-diff

# yarn
yarn add -D pr-visual-diff

# bun
bun add -D pr-visual-diff
```

Then install Playwright's Chromium browser (one-time, ~130 MB):

```bash
npx playwright install chromium
```

For CI, prefer:

```bash
npx playwright install chromium-headless-shell --with-deps
```

---

## Project setup — Next.js

Your `package.json` must have scripts that build and start the app in production mode. The tool will run these commands verbatim inside each Git worktree.

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -H 127.0.0.1 -p 3000"
  }
}
```

> **Important:** Pass `-H 127.0.0.1` to `next start`. The tool polls `http://127.0.0.1:<port>` to know when the server is ready. If Next.js binds to `0.0.0.0` or `localhost` only, the readiness check may resolve differently across environments.

---

## Project setup — Vite + React

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1 --port 4173"
  }
}
```

Note that Vite's `dev` server is intentionally **not** used — `vite preview` serves the production build, which is more stable and deterministic for screenshots.

The auto-detected start command for Vite is:

```
npm run preview -- --host 127.0.0.1
```

If your preview script already includes `--host 127.0.0.1`, you can leave `startCommand` at the auto-detected value.

---

## Initialize the config

Run this once from your project root:

```bash
npx pr-visual-diff init
```

This detects your package manager and framework and writes `.visualdiff.json` with sensible defaults. Commit this file.

```bash
git add .visualdiff.json
git commit -m "chore: add pr-visual-diff config"
```

---

## Run the doctor check

Before your first real run, verify the environment:

```bash
npx pr-visual-diff doctor
```

This checks:
- Git is available
- Node.js is available
- Playwright can be imported
- Your framework and package manager are detected
- `.visualdiff.json` exists and is valid

Fix any warnings before running `pr-visual-diff run`.

---

## Run your first diff

Make sure you're on a feature branch with at least one commit that differs from your base branch, and that your working tree is clean (no uncommitted tracked-file changes).

```bash
npx pr-visual-diff run
```

The tool prints progress as it works:

```
✓ Config loaded
✓ Base and head worktrees prepared
  Installing dependencies in /tmp/pr-visual-diff-base-xxxx/base
  Starting app in /tmp/pr-visual-diff-base-xxxx/base
✓ Base app built and captured
  Starting app in /tmp/pr-visual-diff-head-xxxx/head
✓ Head app built and captured
✓ Generated 4 diffs
  2 visual changes detected in 94.3s
✓ Report ready: /your-project/.visual-diff/report.html
```

Open the report:

```bash
open .visual-diff/report.html      # macOS
xdg-open .visual-diff/report.html  # Linux
start .visual-diff/report.html     # Windows
```

---

## Configuration reference

`.visualdiff.json` lives at your project root. Every field is optional except where noted.

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
    { "path": "/dashboard", "expectUrl": "/dashboard" },
    "/settings"
  ],
  "viewports": [
    { "name": "desktop", "width": 1440, "height": 900 },
    { "name": "mobile",  "width": 390,  "height": 844  }
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

### Top-level fields

| Field | Type | Default | Description |
|---|---|---|---|
| `baseBranch` | `string` | **required** | The branch to compare against. Prefer a remote ref such as `"origin/main"` so PR-style checks stay aligned with the real base branch. |
| `framework` | `"next"` \| `"vite"` | auto-detected | Tells the tool which port and start command defaults to use. |
| `installCommand` | `string` | auto-detected | Run once per worktree if `node_modules` is absent. E.g. `"pnpm install"`. |
| `buildCommand` | `string` | auto-detected | Run to produce the production build inside each worktree. |
| `startCommand` | `string` | auto-detected | Run to start the production server. Must bind to `127.0.0.1`. |
| `port` | `number` | `3000` (Next.js), `4173` (Vite) | Port the server listens on. Passed as `PORT` env var to build and start commands. |
| `readyUrl` | `string` | `http://127.0.0.1:<port>` | URL polled until it returns a non-5xx response, after which screenshots begin. |
| `outputDir` | `string` | `".visual-diff"` | Directory where `report.html`, `manifest.json`, and all images are written. Relative to project root. |
| `routes` | `Array<string \| { path: string, expectUrl?: string }>` | `["/"]` | Pages to screenshot. Maximum 10. Use route objects with `expectUrl` when you want the run to fail on unexpected redirects such as `/login`. |
| `viewports` | `Viewport[]` | desktop + mobile | List of `{ name, width, height }` objects. At least one required. |

### `capture` fields

| Field | Type | Default | Description |
|---|---|---|---|
| `headless` | `boolean` | `true` | Set to `false` to watch Chromium open during capture. Useful for debugging setup scripts. |
| `settleMs` | `number` | `1200` | Milliseconds to wait after the page loads before taking the screenshot. Increase if you have loading spinners, lazy images, or animations that take time to resolve. |
| `readyTimeoutMs` | `number` | `60000` | How long (ms) to wait for the server to become ready before giving up. Increase for slow builds on CI. |
| `disableAnimations` | `boolean` | `true` | Injects CSS to freeze all animations and transitions. Keeps diffs clean. Disable only if you specifically want to diff animated states. |
| `maskSelectors` | `string[]` | `[]` | CSS selectors for elements that should be blacked out before the screenshot is taken. Use for timestamps, avatars, ads, or any content that changes between runs. |
| `headers` | `Record<string, string>` | `{}` | Extra HTTP headers sent during setup and route capture. Useful for header-based visual diff bypass contracts. |

### `diff` fields

| Field | Type | Default | Description |
|---|---|---|---|
| `threshold` | `number` | `0.1` | Per-pixel sensitivity, from `0` (exact match) to `1` (ignore everything). `0.1` ignores minor anti-aliasing differences. Raise to `0.2`–`0.3` for noisy content. |
| `failOnChange` | `boolean` | `false` | Exit with code `1` when any visual changes are detected. Use in CI to block merges on visual regressions. |

### `auth` fields

| Field | Type | Default | Description |
|---|---|---|---|
| `setupScript` | `string` | `""` | Path to a `.mjs` / `.js` setup module **relative to the worktree root**. The module runs once before any screenshots are taken. Its browser storage state (cookies, localStorage) is reused for all route captures. |

---

## CLI reference

### `init`

```bash
npx pr-visual-diff init [--config <path>]
```

Writes a new `.visualdiff.json` with auto-detected defaults. Fails if the file already exists.

| Option | Description |
|---|---|
| `--config <path>` | Write the config file to a custom path instead of `.visualdiff.json` |

---

### `doctor`

```bash
npx pr-visual-diff doctor [--config <path>]
```

Validates the environment and config. Always run this when setting up a new project or debugging a failing `run`.

---

### `run`

```bash
npx pr-visual-diff run [options]
```

Runs the full comparison. All options override the values in `.visualdiff.json` for this run only — the config file is not modified.

| Option | Description |
|---|---|
| `--base <branch>` | Override `baseBranch` |
| `--routes <csv>` | Override routes, comma-separated. E.g. `--routes /,/dashboard` |
| `--headless` | Force headless mode |
| `--no-headless` | Force headed mode for debugging setup and capture issues |
| `--verbose` | Print debug output including install/build/start logs |
| `--config <path>` | Use a config file other than `.visualdiff.json` |
| `--output <dir>` | Override `outputDir` |
| `--fail-on-change` | Exit `1` if any visual changes are detected |

#### Common one-off invocations

```bash
# Check only the homepage, quickly
npx pr-visual-diff run --routes /

# Compare against a specific branch
npx pr-visual-diff run --base release/2.0

# Debug a flaky capture — watch the browser
npx pr-visual-diff run --no-headless --verbose

# CI: block on any visual change
npx pr-visual-diff run --fail-on-change
```

---

## Auth and setup hooks

If your app requires authentication, do not try to make `pr-visual-diff` understand your whole login stack. Keep auth policy in the app, then use `auth.setupScript` only to activate an app-owned bypass contract or deterministic fixture mode.

```json
{
  "auth": {
    "setupScript": "scripts/visual-diff-setup.mjs"
  }
}
```

Create `scripts/visual-diff-setup.mjs`:

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

The function receives:

| Parameter | Type | Description |
|---|---|---|
| `browser` | `Browser` | The Playwright Browser instance |
| `context` | `BrowserContext` | A fresh context used only for setup |
| `page` | `Page` | A page inside that context |
| `baseUrl` | `string` | The app's base URL, e.g. `http://127.0.0.1:3000` |
| `snapshotDir` | `string` | Absolute path to the output directory for this snapshot |
| `worktreeDir` | `string` | Absolute path to this snapshot's worktree |
| `logger` | `Logger` | The tool's logger — use `logger.info()` for status output |

After the function returns, the browser context's storage state (cookies + `localStorage`) is saved and reused for every route screenshot.

Recommended app contract:

```bash
VISUAL_DIFF_BYPASS_AUTH=true
VISUAL_DIFF_BYPASS_SECRET=<random-long-secret>
VISUAL_DIFF_FIXTURE_MODE=true
```

Your app should only bypass auth when the env flag is enabled and the cookie or header secret matches. Keep secrets in ignored env files or CI secrets, never in the repository.

### Header-based bypass

If your app prefers a header instead of a cookie, configure it directly:

```json
{
  "capture": {
    "headers": {
      "x-visual-diff-bypass": "secret-from-ci"
    }
  }
}
```

### Route assertions

If a protected route should stay on the same URL, declare that expectation so the run fails instead of quietly capturing `/login`:

```json
{
  "routes": [
    {
      "path": "/dashboard",
      "expectUrl": "/dashboard"
    }
  ]
}
```

### Seeding deterministic data

If your routes render database-backed content, seed or switch to fixture mode inside the setup hook so both snapshots stay deterministic:

```js
export default async function setup({ page, baseUrl, worktreeDir, logger }) {
  // Seed via an internal API route
  await page.goto(`${baseUrl}/api/seed?key=visual-diff-test`);
  logger.info("Test data seeded");

  // Then activate your bypass contract
  await setVisualDiffBypassCookie({
    page,
    baseUrl,
    secret: process.env.VISUAL_DIFF_BYPASS_SECRET
  });
}
```

### Debugging the setup script

Set `capture.headless` to `false` to watch the browser run through your setup script:

```json
{
  "capture": { "headless": false }
}
```

Or use the CLI flag:

```bash
npx pr-visual-diff run --no-headless --verbose
```

The full app-side strategy is documented in [docs/authenticated-visual-diff.md](./docs/authenticated-visual-diff.md).

---

## Masking dynamic content

Some elements change on every render (timestamps, avatars fetched from an external CDN, ads, random placeholder text). Masking replaces them with a solid black rectangle before the diff is calculated, so they never show as false positives.

### Using `maskSelectors`

```json
{
  "capture": {
    "maskSelectors": [
      "[data-testid='last-updated']",
      ".user-avatar",
      "#ad-banner"
    ]
  }
}
```

Any valid CSS selector works.

### Settling animations

`settleMs` (default `1200`) is how long the tool waits after page load before taking the screenshot. If your page has skeleton loaders, lazy-loaded images, or charts that animate in, increase this value:

```json
{
  "capture": {
    "settleMs": 2500
  }
}
```

`disableAnimations: true` (the default) injects this CSS before the settle delay:

```css
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
  scroll-behavior: auto !important;
}
```

Leave it enabled. Only turn it off if you specifically need to diff an animated state.

---

## Understanding the output

After a successful run, `.visual-diff/` contains:

```
.visual-diff/
  report.html          ← open this in a browser
  manifest.json        ← machine-readable run summary
  home/
    desktop/
      before.png       ← screenshot from base branch
      after.png        ← screenshot from your branch
      diff.png         ← highlighted pixel differences
    mobile/
      before.png
      after.png
      diff.png
  dashboard/
    desktop/
      ...
```

Route paths are slugified: `/` becomes `home`, `/dashboard` stays `dashboard`, `/settings/profile` becomes `settings__profile`.

### Report statuses

| Status | Meaning |
|---|---|
| `unchanged` | Zero pixels diffed above the threshold |
| `changed` | At least one pixel diffed — the diff image shows exactly where |
| `failed` | Playwright could not load or screenshot the route (network error, JS crash, auth failure) |

### Reading `manifest.json`

```json
{
  "generatedAt": "2025-05-09T10:23:00.000Z",
  "baseBranch": "origin/main",
  "results": [
    {
      "route": "/dashboard",
      "slug": "dashboard",
      "viewport": { "name": "desktop", "width": 1440, "height": 900 },
      "status": "changed",
      "pixelCount": 1842,
      "diffRatio": 0.0014,
      "hasBefore": true,
      "hasAfter": true,
      "beforePath": "dashboard/desktop/before.png",
      "afterPath": "dashboard/desktop/after.png",
      "diffPath": "dashboard/desktop/diff.png",
      "error": null
    }
  ]
}
```

`diffRatio` is `pixelCount / (width × height)`. A ratio of `0.001` means 0.1% of pixels changed.

---

## Integrating into your workflow

### Add `.visual-diff` to `.gitignore`

The output directory should not be committed:

```
# .gitignore
.visual-diff/
visual-diff*.log
```

### Pre-push Git hook

Run the diff automatically before every push. Create `.git/hooks/pre-push`:

```bash
#!/bin/sh
echo "Running visual diff against main..."
npx pr-visual-diff run --fail-on-change
```

Make it executable:

```bash
chmod +x .git/hooks/pre-push
```

Now `git push` will abort if visual regressions are detected.

### npm script shortcut

Add to your `package.json`:

```json
{
  "scripts": {
    "visual-diff": "pr-visual-diff run",
    "visual-diff:ci": "pr-visual-diff run --fail-on-change"
  }
}
```

```bash
npm run visual-diff          # local inspection
npm run visual-diff:ci       # CI-style: fails on any change
```

### Recommended `.visualdiff.json` for a team

```json
{
  "baseBranch": "origin/main",
  "framework": "next",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "startCommand": "npm run start",
  "port": 3000,
  "routes": ["/", { "path": "/dashboard", "expectUrl": "/dashboard" }, "/settings"],
  "viewports": [
    { "name": "desktop", "width": 1440, "height": 900 },
    { "name": "mobile",  "width": 390,  "height": 844  }
  ],
  "capture": {
    "headless": true,
    "settleMs": 1500,
    "readyTimeoutMs": 120000,
    "disableAnimations": true,
    "maskSelectors": ["[data-testid='timestamp']", ".avatar"],
    "headers": {}
  },
  "diff": {
    "threshold": 0.1,
    "failOnChange": false
  }
}
```

Use `npm ci` (not `npm install`) for reproducible installs across machines.

---

## Troubleshooting

### `Tracked working tree changes detected`

You have uncommitted changes to tracked files. Stash or commit them first:

```bash
git stash
npx pr-visual-diff run
git stash pop
```

### `Could not detect server readiness at http://127.0.0.1:3000`

The server did not respond within `readyTimeoutMs`. Common causes:

- **Build failed** — run with `--verbose` to see the build output.
- **Port conflict** — another process is using the same port. Change `port` in your config.
- **Wrong host** — your `startCommand` must bind to `127.0.0.1`. For Next.js, use `next start -H 127.0.0.1`.
- **Slow build** — increase `readyTimeoutMs` to `120000` or more.

Recent app output is included in the failure message, including port conflicts like `EADDRINUSE`.

```bash
npx pr-visual-diff run --verbose
```

### `Command failed during build: npm run build`

The build exited non-zero. The error output from the build is printed above this line. Common causes:

- Missing environment variables — your build may require a `.env.local` that exists in your working copy but not in the worktree. Add required vars to `buildCommand` directly: `"buildCommand": "NEXT_PUBLIC_API_URL=http://localhost npx next build"`.
- TypeScript errors — fix them before running the diff.

### All routes show as `failed`

Usually a sign that the auth/setup script is not completing correctly, or the route redirected to an unexpected final URL. Run with `--no-headless` and `--verbose` to watch what happens:

```bash
npx pr-visual-diff run --no-headless --verbose
```

### Screenshots look different even with no code changes

- **Fonts** — system fonts render differently on different OS/CI machines. Use web fonts or a self-hosted font to guarantee consistency.
- **Animations not fully disabled** — CSS-in-JS libraries may inject styles after the `disableAnimations` CSS is applied. Add the animated elements to `maskSelectors`.
- **External data** — screenshots include live API data. Seed deterministic data in a setup script or mask the dynamic elements.
- **Dates/times** — mask any elements that render the current time.

### `Failed to launch Playwright Chromium`

The package is installed, but the browser binary is missing for the current machine or CI image.

```bash
npx playwright install chromium
```

For CI:

```bash
npx playwright install chromium-headless-shell --with-deps
```

### `Config already exists` when running `init`

The `.visualdiff.json` already exists. Edit it directly rather than re-running `init`.

### `framework must be either 'next' or 'vite'`

Auto-detection reads `dependencies` in `package.json`. If neither `next` nor `vite` is found, it defaults to `"next"`. Override explicitly in your config:

```json
{ "framework": "vite" }
```
