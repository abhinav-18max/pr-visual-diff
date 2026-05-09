import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";

import { VisualDiffError, exists } from "@pr-visual-diff/core";

function createLogBuffer(limit = 40) {
  const lines = [];

  return {
    push(chunk) {
      const text = chunk.toString().trimEnd();
      if (!text) {
        return;
      }

      lines.push(...text.split("\n"));
      if (lines.length > limit) {
        lines.splice(0, lines.length - limit);
      }
    },
    toString() {
      return lines.join("\n");
    },
    includes(value) {
      return lines.some((line) => line.includes(value));
    }
  };
}

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
    const stderrBuffer = createLogBuffer();
    const stdoutBuffer = createLogBuffer();

    child.stdout.on("data", (chunk) => {
      stdoutBuffer.push(chunk);
      logger.debug(`[${label}] ${chunk.toString().trimEnd()}`);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString().trimEnd();
      logger.debug(`[${label}] ${text}`);
      stderrBuffer.push(chunk);
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

      const detail = stderrBuffer.toString() || stdoutBuffer.toString();
      reject(
        new VisualDiffError(
          `Command failed during ${label}: ${command}\nWorking directory: ${cwd}${detail ? `\n\nRecent output:\n${detail}` : ""}`,
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
  let lastStatus = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(readyUrl, {
        method: "GET",
        redirect: "manual"
      });

      lastStatus = response.status;

      if (response.status < 500) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  const statusDetail = lastStatus ? ` Last HTTP status: ${lastStatus}.` : "";
  throw new VisualDiffError(`Could not detect server readiness at ${readyUrl}.${statusDetail}`, {
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
  const logBuffer = createLogBuffer();

  const child = spawn(startCommand, [], {
    ...buildSpawnOptions(cwd, {
      PORT: String(port),
      HOST: "127.0.0.1"
    }),
    detached: process.platform !== "win32"
  });

  child.stdout.on("data", (chunk) => {
    logBuffer.push(chunk);
    logger.debug(`[app] ${chunk.toString().trimEnd()}`);
  });

  child.stderr.on("data", (chunk) => {
    logBuffer.push(chunk);
    logger.debug(`[app] ${chunk.toString().trimEnd()}`);
  });

  child.on("error", (error) => {
    logger.debug(`[app] ${error.message}`);
  });

  const kill = createKillHandler(child);

  try {
    await Promise.race([
      waitForReady(readyUrl, readyTimeoutMs, logger),
      new Promise((_, reject) => {
        child.on("exit", (code, signal) => {
          reject(
            new VisualDiffError(
              `App exited before it became ready: ${startCommand}\nWorking directory: ${cwd}${logBuffer.toString() ? `\n\nRecent output:\n${logBuffer.toString()}` : ""}`,
              {
                code: "APP_EXITED_EARLY",
                cause: new Error(`exit code ${code ?? "unknown"}${signal ? ` (${signal})` : ""}`)
              }
            )
          );
        });
      })
    ]);
  } catch (error) {
    await kill();
    if (error instanceof VisualDiffError && error.code === "READY_TIMEOUT") {
      const hint = logBuffer.includes("EADDRINUSE")
        ? " Port is already in use. Pick a different port or stop the existing server."
        : "";
      throw new VisualDiffError(
        `${error.message}${hint}${logBuffer.toString() ? `\n\nRecent app output:\n${logBuffer.toString()}` : ""}`,
        {
          code: error.code,
          cause: error.cause ?? error
        }
      );
    }
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
