import { access } from "node:fs/promises";
import path from "node:path";

export function slugifyRoute(route) {
  if (route === "/") {
    return "home";
  }

  return route
    .replace(/^\//, "")
    .replace(/[?#].*$/, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\//g, "__")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "") || "route";
}

export function mergeConfig(baseConfig, overrides) {
  const nextConfig = structuredClone(baseConfig);

  if (overrides.baseBranch) {
    nextConfig.baseBranch = overrides.baseBranch;
  }

  if (overrides.routes?.length) {
    nextConfig.routes = overrides.routes;
  }

  if (typeof overrides.headless === "boolean") {
    nextConfig.capture.headless = overrides.headless;
  }

  if (overrides.outputDir) {
    nextConfig.outputDir = overrides.outputDir;
  }

  if (typeof overrides.failOnChange === "boolean") {
    nextConfig.diff.failOnChange = overrides.failOnChange;
  }

  return nextConfig;
}

export async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function resolveCommandForPackageManager(manager, phase, framework) {
  const commandMap = {
    npm: {
      install: "npm install",
      nextBuild: "npm run build",
      nextStart: "npm run start",
      viteBuild: "npm run build",
      viteStart: "npm run preview -- --host 127.0.0.1"
    },
    pnpm: {
      install: "pnpm install",
      nextBuild: "pnpm build",
      nextStart: "pnpm start",
      viteBuild: "pnpm build",
      viteStart: "pnpm preview -- --host 127.0.0.1"
    },
    yarn: {
      install: "yarn install",
      nextBuild: "yarn build",
      nextStart: "yarn start",
      viteBuild: "yarn build",
      viteStart: "yarn preview --host 127.0.0.1"
    },
    bun: {
      install: "bun install",
      nextBuild: "bun run build",
      nextStart: "bun run start",
      viteBuild: "bun run build",
      viteStart: "bun run preview -- --host 127.0.0.1"
    }
  };

  const managerCommands = commandMap[manager] ?? commandMap.npm;

  if (phase === "install") {
    return managerCommands.install;
  }

  if (framework === "next") {
    return phase === "build" ? managerCommands.nextBuild : managerCommands.nextStart;
  }

  return phase === "build" ? managerCommands.viteBuild : managerCommands.viteStart;
}

export function detectFrameworkFromPackageJson(packageJson) {
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  if (deps.next) {
    return "next";
  }

  if (deps.vite) {
    return "vite";
  }

  return "next";
}

export function normalizeRoute(route) {
  if (!route.startsWith("/")) {
    return `/${route}`;
  }

  return route;
}

export function formatDuration(startTime) {
  return `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
}

export function resolveOutputPath(projectRoot, outputDir) {
  return path.resolve(projectRoot, outputDir);
}
