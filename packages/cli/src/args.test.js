import test from "node:test";
import assert from "node:assert/strict";

import { parseCliArgs } from "./args.js";

test("parseCliArgs supports --no-headless", () => {
  const parsed = parseCliArgs(["run", "--no-headless"]);
  assert.equal(parsed.options.headless, false);
});
