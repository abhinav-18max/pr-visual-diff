import path from "node:path";
import { pathToFileURL } from "node:url";

import { ensureDir, slugifyRoute } from "@pr-visual-diff/core";

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
  logger
}) {
  if (!setupScript) {
    return null;
  }

  logger.info(`Running auth/setup hook: ${setupScriptPath}`);

  const context = await browser.newContext();
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
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: capture.headless
  });

  const setupScriptPath = auth.setupScript
    ? path.resolve(worktreeDir, auth.setupScript)
    : "";
  const setupScript = await loadSetupScript(setupScriptPath);

  try {
    const storageState = await runSetupHook({
      browser,
      setupScript,
      setupScriptPath,
      baseUrl,
      snapshotDir: outputDir,
      worktreeDir,
      logger
    });

    const results = [];

    for (const route of routes) {
      const slug = slugifyRoute(route);

      for (const viewport of viewports) {
        const routeDir = path.join(outputDir, slug, viewport.name);
        const screenshotPath = path.join(routeDir, `${snapshotName}.png`);

        await ensureDir(routeDir);

        try {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            storageState: storageState ?? undefined
          });

          try {
            const page = await context.newPage();

            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.goto(new URL(route, baseUrl).toString(), {
              waitUntil: "load"
            });

            if (capture.disableAnimations) {
              await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
            }

            if (capture.settleMs > 0) {
              await page.waitForTimeout(capture.settleMs);
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
            route,
            slug,
            viewport,
            snapshotName,
            screenshotPath,
            status: "captured"
          });
        } catch (error) {
          logger.warn(`Failed to capture ${route} (${viewport.name}) on ${snapshotName}`);
          results.push({
            route,
            slug,
            viewport,
            snapshotName,
            screenshotPath,
            status: "failed",
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
