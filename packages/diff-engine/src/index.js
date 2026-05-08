import path from "node:path";
import { copyFile, readFile, writeFile } from "node:fs/promises";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { ensureDir } from "@pr-visual-diff/core";

function makeResultKey(entry) {
  return `${entry.route}::${entry.viewport.name}`;
}

async function compareImages(beforePath, afterPath, diffPath, threshold) {
  const before = PNG.sync.read(await readFile(beforePath));
  const after = PNG.sync.read(await readFile(afterPath));

  const width = Math.max(before.width, after.width);
  const height = Math.max(before.height, after.height);

  const normalizedBefore = new PNG({ width, height });
  const normalizedAfter = new PNG({ width, height });

  PNG.bitblt(before, normalizedBefore, 0, 0, before.width, before.height, 0, 0);
  PNG.bitblt(after, normalizedAfter, 0, 0, after.width, after.height, 0, 0);

  const diff = new PNG({ width, height });
  const pixelCount = pixelmatch(
    normalizedBefore.data,
    normalizedAfter.data,
    diff.data,
    width,
    height,
    { threshold }
  );

  await writeFile(diffPath, PNG.sync.write(diff));

  return {
    width,
    height,
    pixelCount,
    diffRatio: pixelCount / (width * height)
  };
}

export async function generateDiffArtifacts({
  outputDir,
  baseResults,
  headResults,
  diffConfig,
  logger
}) {
  const baseMap = new Map(baseResults.map((entry) => [makeResultKey(entry), entry]));
  const headMap = new Map(headResults.map((entry) => [makeResultKey(entry), entry]));
  const allKeys = new Set([...baseMap.keys(), ...headMap.keys()]);

  const results = [];

  for (const key of allKeys) {
    const before = baseMap.get(key);
    const after = headMap.get(key);
    const reference = before ?? after;
    const assetDir = path.join(outputDir, reference.slug, reference.viewport.name);
    const beforeOutputPath = path.join(assetDir, "before.png");
    const afterOutputPath = path.join(assetDir, "after.png");
    const diffOutputPath = path.join(assetDir, "diff.png");

    await ensureDir(assetDir);

    const result = {
      route: reference.route,
      slug: reference.slug,
      viewport: reference.viewport,
      status: "failed",
      pixelCount: null,
      diffRatio: null,
      hasBefore: before?.status === "captured",
      hasAfter: after?.status === "captured",
      beforePath: path.relative(outputDir, beforeOutputPath),
      afterPath: path.relative(outputDir, afterOutputPath),
      diffPath: path.relative(outputDir, diffOutputPath),
      error: null
    };

    if (before?.status === "captured") {
      await copyFile(before.screenshotPath, beforeOutputPath);
    }

    if (after?.status === "captured") {
      await copyFile(after.screenshotPath, afterOutputPath);
    }

    if (before?.status !== "captured" || after?.status !== "captured") {
      result.error = before?.error ?? after?.error ?? "Capture missing for one snapshot";
      results.push(result);
      continue;
    }

    const metrics = await compareImages(
      before.screenshotPath,
      after.screenshotPath,
      diffOutputPath,
      diffConfig.threshold
    );

    result.pixelCount = metrics.pixelCount;
    result.diffRatio = metrics.diffRatio;
    result.status = metrics.pixelCount > 0 ? "changed" : "unchanged";
    results.push(result);
  }

  const changedCount = results.filter((item) => item.status === "changed").length;
  logger.success(`Generated ${results.length} diffs`);

  return {
    results,
    changedCount
  };
}
