import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";

import { VisualDiffError, exists } from "@pr-visual-diff/core";

function buildSpawnOptions(cwd, extraEnv = {}) {
  return {
    cwd,
    shell: true,
    env: {
      ...process.env,
      ...extraEnv
    },
    stdio: ["ignore", "pipe", "pipe"]
  };
}

export async function runCommand(command, options) {
  const { cwd, env, logger, label } = options;

  await new Promise((resolve, reject) => {
    const child = spawn(command, [], buildSpawnOptions(cwd, env));
    const stderrLines = [];

    child.stdout.on("data", (chunk) => {
      logger.debug(`[${label}] ${chunk.toString().trimEnd()}`);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString().trimEnd();
      logger.debug(`[${label}] ${text}`);
      stderrLines.push(text);
    });

    child.on("error", (error) => {
      reject(
        new VisualDiffError(`Failed to start command: ${command}`, {
          code: "COMMAND_START_FAILED",
          cause: error
        })
      );
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderrLines.slice(-10).join("\n");
      reject(
        new VisualDiffError(
          `Command failed (${label}): ${command}${detail ? `\n${detail}` : ""}`,
          { code: "COMMAND_FAILED" }
        )
      );
    });
  });
}

export async function ensureDependenciesInstalled(cwd, installCommand, logger) {
  if (await exists(path.join(cwd, "node_modules"))) {
    logger.debug(`Dependencies already present in ${cwd}`);
    return;
  }

  logger.info(`Installing dependencies in ${cwd}`);
  await runCommand(installCommand, {
    cwd,
    env: {},
    logger,
    label: "install"
  });
}

async function waitForReady(readyUrl, timeoutMs, logger) {
  const start = Date.now();
  let lastError = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(readyUrl, {
        method: "GET",
        redirect: "manual"
      });

      if (response.status < 500) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new VisualDiffError(`Could not detect server readiness at ${readyUrl}`, {
    code: "READY_TIMEOUT",
    cause: lastError
  });
}

function createKillHandler(child) {
  return async () => {
    if (child.exitCode !== null || child.killed) {
      return;
    }

    if (process.platform === "win32") {
      child.kill("SIGTERM");
      await delay(500);
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
      return;
    }

    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }

    await delay(1000);

    if (child.exitCode === null) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }
  };
}

export async function startApplication({
  cwd,
  startCommand,
  port,
  readyUrl,
  readyTimeoutMs,
  logger
}) {
  logger.info(`Starting app in ${cwd}`);

  const child = spawn(startCommand, [], {
    ...buildSpawnOptions(cwd, {
      PORT: String(port),
      HOST: "127.0.0.1"
    }),
    detached: process.platform !== "win32"
  });

  child.stdout.on("data", (chunk) => {
    logger.debug(`[app] ${chunk.toString().trimEnd()}`);
  });

  child.stderr.on("data", (chunk) => {
    logger.debug(`[app] ${chunk.toString().trimEnd()}`);
  });

  child.on("error", (error) => {
    logger.debug(`[app] ${error.message}`);
  });

  const kill = createKillHandler(child);

  try {
    await waitForReady(readyUrl, readyTimeoutMs, logger);
  } catch (error) {
    await kill();
    throw error;
  }

  return { stop: kill };
}

export async function prepareAndStartSnapshot(snapshotConfig) {
  const {
    cwd,
    installCommand,
    buildCommand,
    startCommand,
    readyUrl,
    port,
    logger,
    readyTimeoutMs
  } = snapshotConfig;

  await ensureDependenciesInstalled(cwd, installCommand, logger);
  await runCommand(buildCommand, {
    cwd,
    env: { PORT: String(port), HOST: "127.0.0.1" },
    logger,
    label: "build"
  });

  return startApplication({
    cwd,
    startCommand,
    port,
    readyUrl,
    readyTimeoutMs,
    logger
  });
}
