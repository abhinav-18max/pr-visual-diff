import path from "node:path";
import { readFile } from "node:fs/promises";

import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_DIFF_THRESHOLD,
  DEFAULT_MAX_ROUTES,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_READY_TIMEOUT_MS,
  DEFAULT_SETTLE_MS,
  DEFAULT_VIEWPORTS
} from "./constants.js";
import { VisualDiffError } from "./errors.js";
import { ensureDir, readJson, writeJson } from "./fs.js";
import {
  detectFrameworkFromPackageJson,
  exists,
  normalizeRouteEntry,
  resolveCommandForPackageManager
} from "./utils.js";

export async function detectPackageManager(projectRoot) {
  const lockfiles = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"]
  ];

  for (const [filename, manager] of lockfiles) {
    if (await exists(path.join(projectRoot, filename))) {
      return manager;
    }
  }

  return "npm";
}

export async function detectFramework(projectRoot) {
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!(await exists(packageJsonPath))) {
    return "next";
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  return detectFrameworkFromPackageJson(packageJson);
}

export async function buildDefaultConfig(projectRoot) {
  const packageManager = await detectPackageManager(projectRoot);
  const framework = await detectFramework(projectRoot);
  const port = framework === "next" ? 3000 : 4173;

  return {
    baseBranch: "origin/main",
    framework,
    installCommand: resolveCommandForPackageManager(packageManager, "install", framework),
    buildCommand: resolveCommandForPackageManager(packageManager, "build", framework),
    startCommand: resolveCommandForPackageManager(packageManager, "start", framework),
    port,
    readyUrl: `http://127.0.0.1:${port}`,
    outputDir: DEFAULT_OUTPUT_DIR,
    routes: ["/"],
    viewports: DEFAULT_VIEWPORTS,
    capture: {
      headless: true,
      settleMs: DEFAULT_SETTLE_MS,
      readyTimeoutMs: DEFAULT_READY_TIMEOUT_MS,
      disableAnimations: true,
      maskSelectors: [],
      headers: {}
    },
    diff: {
      threshold: DEFAULT_DIFF_THRESHOLD,
      failOnChange: false
    },
    auth: {
      setupScript: ""
    }
  };
}

export async function initConfig(projectRoot, configPath = DEFAULT_CONFIG_FILE) {
  const outputPath = path.resolve(projectRoot, configPath);

  if (await exists(outputPath)) {
    throw new VisualDiffError(`Config already exists at ${outputPath}`, {
      code: "CONFIG_EXISTS"
    });
  }

  const defaultConfig = await buildDefaultConfig(projectRoot);
  await ensureDir(path.dirname(outputPath));
  await writeJson(outputPath, defaultConfig);
  return { config: defaultConfig, path: outputPath };
}

function validateViewport(viewport, index) {
  if (!viewport?.name || !viewport?.width || !viewport?.height) {
    throw new VisualDiffError(`Viewport at index ${index} is invalid`, {
      code: "INVALID_VIEWPORT"
    });
  }
}

function validateHeaders(headers) {
  if (headers === undefined) {
    return {};
  }

  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    throw new VisualDiffError("capture.headers must be an object of string header values", {
      code: "INVALID_CONFIG"
    });
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      if (typeof value !== "string") {
        throw new VisualDiffError(`capture.headers.${key} must be a string`, {
          code: "INVALID_CONFIG"
        });
      }

      return [key, value];
    })
  );
}

export function validateConfig(config) {
  if (!config.baseBranch) {
    throw new VisualDiffError("Config must include baseBranch", {
      code: "INVALID_CONFIG"
    });
  }

  if (!["next", "vite"].includes(config.framework)) {
    throw new VisualDiffError("framework must be either 'next' or 'vite'", {
      code: "INVALID_CONFIG"
    });
  }

  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new VisualDiffError("Config must define at least one route", {
      code: "INVALID_CONFIG"
    });
  }

  if (config.routes.length > DEFAULT_MAX_ROUTES) {
    throw new VisualDiffError(`MVP supports up to ${DEFAULT_MAX_ROUTES} routes`, {
      code: "ROUTE_LIMIT"
    });
  }

  if (!Array.isArray(config.viewports) || config.viewports.length === 0) {
    throw new VisualDiffError("Config must define at least one viewport", {
      code: "INVALID_CONFIG"
    });
  }

  config.viewports.forEach(validateViewport);

  const routes = config.routes.map((route, index) => {
    try {
      return normalizeRouteEntry(route, index);
    } catch (error) {
      throw new VisualDiffError(error.message, {
        code: "INVALID_ROUTE",
        cause: error
      });
    }
  });

  return {
    ...config,
    outputDir: config.outputDir ?? DEFAULT_OUTPUT_DIR,
    routes,
    readyUrl: config.readyUrl ?? `http://127.0.0.1:${config.port ?? 3000}`,
    capture: {
      headless: config.capture?.headless ?? true,
      settleMs: config.capture?.settleMs ?? DEFAULT_SETTLE_MS,
      readyTimeoutMs: config.capture?.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS,
      disableAnimations: config.capture?.disableAnimations ?? true,
      maskSelectors: config.capture?.maskSelectors ?? [],
      headers: validateHeaders(config.capture?.headers)
    },
    diff: {
      threshold: config.diff?.threshold ?? DEFAULT_DIFF_THRESHOLD,
      failOnChange: config.diff?.failOnChange ?? false
    },
    auth: {
      setupScript: config.auth?.setupScript ?? ""
    }
  };
}

export async function loadConfig(projectRoot, configPath = DEFAULT_CONFIG_FILE) {
  const fullPath = path.resolve(projectRoot, configPath);

  if (!(await exists(fullPath))) {
    throw new VisualDiffError(
      `Config file not found at ${fullPath}. Run 'pr-visual-diff init' first.`,
      { code: "CONFIG_NOT_FOUND" }
    );
  }

  return {
    path: fullPath,
    config: validateConfig(await readJson(fullPath))
  };
}
