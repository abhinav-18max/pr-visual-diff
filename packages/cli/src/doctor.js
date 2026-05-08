import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

import {
  DEFAULT_CONFIG_FILE,
  detectFramework,
  detectPackageManager,
  exists,
  loadConfig
} from "@pr-visual-diff/core";

const execFileAsync = promisify(execFile);

async function checkGit(logger) {
  await execFileAsync("git", ["--version"]);
  logger.success("Git detected");
}

async function checkNode(logger) {
  if (!process.version) {
    throw new Error("Node.js unavailable");
  }

  logger.success(`Node detected (${process.version})`);
}

async function checkPlaywright(logger) {
  await import("playwright");
  logger.success("Playwright dependency resolvable");
}

export async function runDoctor({ projectRoot, configPath, logger }) {
  await checkGit(logger);
  await checkNode(logger);
  await checkPlaywright(logger);

  const framework = await detectFramework(projectRoot);
  const packageManager = await detectPackageManager(projectRoot);

  logger.success(`Framework detected: ${framework}`);
  logger.success(`Package manager detected: ${packageManager}`);

  const resolvedConfigPath = path.resolve(projectRoot, configPath ?? DEFAULT_CONFIG_FILE);
  if (!(await exists(resolvedConfigPath))) {
    logger.warn(`Config not found at ${resolvedConfigPath}`);
    return { ok: false };
  }

  await loadConfig(projectRoot, configPath ?? DEFAULT_CONFIG_FILE);
  logger.success("Config valid");

  return { ok: true };
}
