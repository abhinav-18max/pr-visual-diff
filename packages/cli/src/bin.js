#!/usr/bin/env node
import { parseCliArgs } from "./args.js";
import { runCli } from "./index.js";

const exitCode = await runCli(parseCliArgs(process.argv.slice(2)));
process.exit(exitCode);
