# Authenticated Visual Diff Strategy

`pr-visual-diff` should not try to understand every app's auth stack. The package should automate the browser, while each app owns a narrow, explicit visual testing bypass contract.

## Recommended contract

Use environment variables that are disabled by default:

```bash
VISUAL_DIFF_BYPASS_AUTH=true
VISUAL_DIFF_BYPASS_SECRET=<random-long-secret>
VISUAL_DIFF_FIXTURE_MODE=true
```

Then activate the bypass from `auth.setupScript` with the helper exported by this package:

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

The application middleware should only skip auth when both conditions are true:

1. `VISUAL_DIFF_BYPASS_AUTH === "true"`
2. The incoming cookie or header matches `VISUAL_DIFF_BYPASS_SECRET`

## Next.js middleware shape

```ts
import { NextResponse, type NextRequest } from "next/server";

function isVisualDiffBypassRequest(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const isEnabled = process.env.VISUAL_DIFF_BYPASS_AUTH === "true";
  const expectedSecret = process.env.VISUAL_DIFF_BYPASS_SECRET;
  const providedSecret = request.cookies.get("visual_diff_bypass")?.value;

  return Boolean(isEnabled && expectedSecret && providedSecret === expectedSecret);
}

export function middleware(request: NextRequest) {
  if (isVisualDiffBypassRequest(request)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}
```

If your app prefers headers instead of cookies, set `capture.headers` in `.visualdiff.json`:

```json
{
  "capture": {
    "headers": {
      "x-visual-diff-bypass": "secret-from-ci"
    }
  }
}
```

## Route assertions

Authenticated captures often fail by silently landing on `/login`. Use route objects with `expectUrl` so the run fails loudly instead of screenshotting the wrong page:

```json
{
  "routes": [
    "/",
    {
      "path": "/dashboard",
      "expectUrl": "/dashboard"
    }
  ]
}
```

## Stable data

Auth bypass is not data bypass. For protected pages, prefer this order:

1. Start with bypass-only for deterministic routes.
2. Add one stable demo project.
3. Add `VISUAL_DIFF_FIXTURE_MODE=true` for dynamic or expensive data.
4. Mock network traffic only for external dependencies or unavoidable noise.

## Setup checklist

```gitignore
.visual-diff/
visual-diff*.log
```

Use `origin/main` for PR-style comparisons:

```json
{
  "baseBranch": "origin/main"
}
```

Keep committed env files public-only. Secrets such as service keys, database URLs, JWT secrets, or bypass secrets belong in ignored env files or CI secrets.

## CI

Install the Playwright browser binary before running diffs:

```yaml
- run: npx playwright install chromium-headless-shell --with-deps
- run: npx pr-visual-diff run --fail-on-change
```

Inject bypass values through CI secrets, not committed files.
