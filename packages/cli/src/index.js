import process from "node:process";

import { createLogger } from "@pr-visual-diff/core";

import { runDoctor } from "./doctor.js";
import { runInit } from "./init.js";
import { runVisualDiff } from "./run.js";

function printHelp() {
  console.log(`pr-visual-diff

Usage:
  pr-visual-diff init
  pr-visual-diff doctor
  pr-visual-diff run

Options:
  --base <branch>
  --routes </,/dashboard>
  --headless
  --no-headless
  --verbose
  --config <path>
  --output <dir>
  --fail-on-change`);
}

export async function runCli(parsedArgs) {
  const projectRoot = process.cwd();
  const logger = createLogger({ verbose: parsedArgs.options.verbose });

  try {
    switch (parsedArgs.command) {
      case "init":
        await runInit({
          projectRoot,
          configPath: parsedArgs.options.configPath,
          verbose: parsedArgs.options.verbose
        });
        return 0;
      case "doctor":
        await runDoctor({
          projectRoot,
          configPath: parsedArgs.options.configPath,
          logger
        });
        return 0;
      case "run": {
        const result = await runVisualDiff({
          projectRoot,
          options: parsedArgs.options
        });
        return result.shouldFail ? 1 : 0;
      }
      default:
        printHelp();
        return 0;
    }
  } catch (error) {
    logger.error(error.message);
    if (parsedArgs.options.verbose && error.cause) {
      console.error(error.cause);
    }
    return 1;
  }
}
