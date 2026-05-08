import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { VisualDiffError } from "@pr-visual-diff/core";

const execFileAsync = promisify(execFile);

async function runGit(args, cwd) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 1024 * 1024 * 10
    });
    return stdout.trim();
  } catch (error) {
    throw new VisualDiffError(`Git command failed: git ${args.join(" ")}`, {
      code: "GIT_COMMAND_FAILED",
      cause: error
    });
  }
}

export async function assertGitRepo(projectRoot) {
  const root = await runGit(["rev-parse", "--show-toplevel"], projectRoot);
  return root;
}

export async function assertCleanTrackedState(projectRoot) {
  const status = await runGit(["status", "--porcelain", "--untracked-files=no"], projectRoot);

  if (status) {
    throw new VisualDiffError(
      "Tracked working tree changes detected. Commit or stash them before running visual diff.",
      { code: "DIRTY_WORKTREE" }
    );
  }
}

export async function resolveBaseRef(projectRoot, baseBranch) {
  return runGit(["rev-parse", "--verify", baseBranch], projectRoot);
}

export async function resolveHeadRef(projectRoot) {
  return runGit(["rev-parse", "--verify", "HEAD"], projectRoot);
}

export async function createWorktree(projectRoot, ref, label) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), `pr-visual-diff-${label}-`));
  const worktreePath = path.join(tempRoot, label);

  await runGit(["worktree", "add", "--detach", worktreePath, ref], projectRoot);

  return {
    path: worktreePath,
    async cleanup() {
      try {
        await runGit(["worktree", "remove", "--force", worktreePath], projectRoot);
      } catch {
        // Best-effort cleanup to preserve run result on failure.
      }
      await rm(tempRoot, { recursive: true, force: true });
    }
  };
}

export async function prepareComparisonWorktrees(projectRoot, baseBranch) {
  await assertGitRepo(projectRoot);
  await assertCleanTrackedState(projectRoot);

  const [baseRef, headRef] = await Promise.all([
    resolveBaseRef(projectRoot, baseBranch),
    resolveHeadRef(projectRoot)
  ]);

  const base = await createWorktree(projectRoot, baseRef, "base");
  let head;

  try {
    head = await createWorktree(projectRoot, headRef, "head");
  } catch (error) {
    await base.cleanup();
    throw error;
  }

  return {
    base,
    head,
    async cleanup() {
      await Promise.allSettled([base.cleanup(), head.cleanup()]);
    }
  };
}
