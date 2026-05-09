import path from "node:path";
import { pathToFileURL } from "node:url";

import { ensureDir, slugifyRoute, VisualDiffError } from "@pr-visual-diff/core";

export { setVisualDiffBypassCookie } from "./auth.js";

const DISABLE_ANIMATIONS_CSS = `
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
`;

async function loadPlaywright() {
  return import("playwright");
}

function formatExpectedUrl(baseUrl, expectedUrl) {
  if (!expectedUrl) {
    return "";
  }

  return expectedUrl.startsWith("http://") || expectedUrl.startsWith("https://")
    ? expectedUrl
    : new URL(expectedUrl, baseUrl).toString();
}

async function loadSetupScript(setupScriptPath) {
  if (!setupScriptPath) {
    return null;
  }

  const module = await import(pathToFileURL(setupScriptPath).href);
  const setupScript = module.default ?? module.setup ?? null;

  if (typeof setupScript !== "function") {
    throw new Error(`Setup script at ${setupScriptPath} must export a function`);
  }

  return setupScript;
}

async function runSetupHook({
  browser,
  setupScript,
  setupScriptPath,
  baseUrl,
  snapshotDir,
  worktreeDir,
  headers,
  logger
}) {
  if (!setupScript) {
    return null;
  }

  logger.info(`Running auth/setup hook: ${setupScriptPath}`);

  const context = await browser.newContext({
    extraHTTPHeaders: headers
  });
  const page = await context.newPage();

  try {
    await setupScript({
      browser,
      context,
      page,
      baseUrl,
      snapshotDir,
      worktreeDir,
      logger
    });

    const storageState = await context.storageState();
    return storageState;
  } finally {
    await context.close();
  }
}

async function createMaskLocators(page, selectors) {
  const masks = [];

  for (const selector of selectors) {
    masks.push(page.locator(selector));
  }

  return masks;
}

export async function captureSnapshotSet({
  snapshotName,
  worktreeDir,
  baseUrl,
  routes,
  viewports,
  capture,
  auth,
  outputDir,
  logger
}) {
  let browser;

  try {
    const { chromium } = await loadPlaywright();
    browser = await chromium.launch({
      headless: capture.headless
    });
  } catch (error) {
    throw new VisualDiffError(
      "Failed to launch Playwright Chromium. Install the browser with 'npx playwright install chromium' locally or 'npx playwright install chromium-headless-shell --with-deps' in CI.",
      {
        code: "BROWSER_LAUNCH_FAILED",
        cause: error
      }
    );
  }

  const setupScriptPath = auth.setupScript
    ? path.resolve(worktreeDir, auth.setupScript)
    : "";

  try {
    const setupScript = await loadSetupScript(setupScriptPath);
    const storageState = await runSetupHook({
      browser,
      setupScript,
      setupScriptPath,
      baseUrl,
      snapshotDir: outputDir,
      worktreeDir,
      headers: capture.headers,
      logger
    });

    const results = [];

    for (const routeEntry of routes) {
      const slug = slugifyRoute(routeEntry.path);

      for (const viewport of viewports) {
        const routeDir = path.join(outputDir, slug, viewport.name);
        const screenshotPath = path.join(routeDir, `${snapshotName}.png`);

        await ensureDir(routeDir);

        try {
          let finalUrl = null;

          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            storageState: storageState ?? undefined,
            extraHTTPHeaders: capture.headers
          });

          try {
            const page = await context.newPage();

            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.goto(new URL(routeEntry.path, baseUrl).toString(), {
              waitUntil: "load"
            });

            if (capture.disableAnimations) {
              await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
            }

            if (capture.settleMs > 0) {
              await page.waitForTimeout(capture.settleMs);
            }

            finalUrl = page.url();
            const expectedUrl = formatExpectedUrl(baseUrl, routeEntry.expectUrl);

            if (expectedUrl && finalUrl !== expectedUrl) {
              throw new VisualDiffError(
                `Route ${routeEntry.path} resolved to ${finalUrl}, expected ${expectedUrl}. If this route should stay authenticated, configure auth.setupScript or capture.headers for your visual diff bypass.`,
                { code: "UNEXPECTED_FINAL_URL" }
              );
            }

            const mask = await createMaskLocators(page, capture.maskSelectors);
            await page.screenshot({
              path: screenshotPath,
              fullPage: true,
              mask
            });
          } finally {
            await context.close();
          }

          results.push({
            route: routeEntry.path,
            slug,
            viewport,
            snapshotName,
            screenshotPath,
            status: "captured",
            expectedUrl: routeEntry.expectUrl,
            finalUrl
          });
        } catch (error) {
          logger.warn(`Failed to capture ${routeEntry.path} (${viewport.name}) on ${snapshotName}`);
          results.push({
            route: routeEntry.path,
            slug,
            viewport,
            snapshotName,
            screenshotPath,
            status: "failed",
            expectedUrl: routeEntry.expectUrl,
            finalUrl: null,
            error: error.message
          });
        }
      }
    }

    return results;
  } finally {
    await browser.close();
  }
}
