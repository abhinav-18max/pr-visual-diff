import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeJson } from "./fs.js";

test("writeJson writes formatted JSON", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "visual-diff-fs-"));
  const target = path.join(dir, "nested", "config.json");

  await writeJson(target, { hello: "world" });

  const output = await readFile(target, "utf8");
  assert.equal(output, '{\n  "hello": "world"\n}\n');
});
