import test from "node:test";
import assert from "node:assert/strict";

import { validateConfig } from "./config.js";

test("validateConfig normalizes route objects and capture headers", () => {
  const config = validateConfig({
    baseBranch: "origin/main",
    framework: "next",
    routes: [
      "/",
      {
        path: "dashboard",
        expectUrl: "/dashboard"
      }
    ],
    viewports: [{ name: "desktop", width: 1440, height: 900 }],
    capture: {
      headers: {
        "x-visual-diff": "true"
      }
    },
    diff: {},
    auth: {}
  });

  assert.deepEqual(config.routes, [
    { path: "/", expectUrl: null },
    { path: "/dashboard", expectUrl: "/dashboard" }
  ]);
  assert.deepEqual(config.capture.headers, {
    "x-visual-diff": "true"
  });
});
