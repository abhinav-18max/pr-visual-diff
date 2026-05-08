import path from "node:path";
import { rm } from "node:fs/promises";

import {
  DEFAULT_CONFIG_FILE,
  createLogger,
  formatDuration,
  loadConfig,
  mergeConfig,
  resolveOutputPath,
  validateConfig
} from "@pr-visual-diff/core";
import { prepareComparisonWorktrees } from "@pr-visual-diff/git";
import { prepareAndStartSnapshot } from "@pr-visual-diff/runner";
import { captureSnapshotSet } from "@pr-visual-diff/screenshots";
import { generateDiffArtifacts } from "@pr-visual-diff/diff-engine";
import { writeReport } from "@pr-visual-diff/reporter";

async function captureForSnapshot({
  snapshotName,
  worktreePath,
  config,
  captureDir,
  logger
}) {
  const app = await prepareAndStartSnapshot({
    cwd: worktreePath,
    installCommand: config.installCommand,
    buildCommand: config.buildCommand,
    startCommand: config.startCommand,
    readyUrl: config.readyUrl,
    port: config.port,
    readyTimeoutMs: config.capture.readyTimeoutMs,
    logger
  });

  try {
    return await captureSnapshotSet({
      snapshotName,
      worktreeDir: worktreePath,
      baseUrl: config.readyUrl,
      routes: config.routes,
      viewports: config.viewports,
      capture: config.capture,
      auth: config.auth,
      outputDir: path.join(captureDir, snapshotName),
      logger
    });
  } finally {
    await app.stop();
  }
}

export async function runVisualDiff({
  projectRoot,
  options
}) {
  const logger = createLogger({ verbose: options.verbose });
  const startedAt = Date.now();

  const { config: rawConfig } = await loadConfig(projectRoot, options.configPath ?? DEFAULT_CONFIG_FILE);
  const config = validateConfig(mergeConfig(rawConfig, options));
  const outputDir = resolveOutputPath(projectRoot, config.outputDir);
  const captureDir = path.join(outputDir, ".captures");

  await rm(outputDir, { recursive: true, force: true });

  logger.success("Config loaded");
  const worktrees = await prepareComparisonWorktrees(projectRoot, config.baseBranch);
  logger.success("Base and head worktrees prepared");

  try {
    const baseResults = await captureForSnapshot({
      snapshotName: "before",
      worktreePath: worktrees.base.path,
      config,
      captureDir,
      logger
    });
    logger.success("Base app built and captured");

    const headResults = await captureForSnapshot({
      snapshotName: "after",
      worktreePath: worktrees.head.path,
      config,
      captureDir,
      logger
    });
    logger.success("Head app built and captured");

    const diffOutput = await generateDiffArtifacts({
      outputDir,
      baseResults,
      headResults,
      diffConfig: config.diff,
      logger
    });

    const report = await writeReport(
      outputDir,
      {
        generatedAt: new Date().toISOString(),
        baseBranch: config.baseBranch,
        results: diffOutput.results
      },
      logger
    );

    logger.info(`${diffOutput.changedCount} visual changes detected in ${formatDuration(startedAt)}`);

    return {
      changedCount: diffOutput.changedCount,
      summary: report.summary,
      outputDir,
      shouldFail: config.diff.failOnChange && diffOutput.changedCount > 0
    };
  } finally {
    await worktrees.cleanup();
  }
}
