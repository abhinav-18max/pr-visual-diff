import test from "node:test";
import assert from "node:assert/strict";

import { mergeConfig, normalizeRouteEntry, slugifyRoute } from "./utils.js";

test("slugifyRoute maps the home route", () => {
  assert.equal(slugifyRoute("/"), "home");
});

test("slugifyRoute strips query strings", () => {
  assert.equal(slugifyRoute("/dashboard?tab=usage"), "dashboard");
});

test("mergeConfig applies run overrides", () => {
  const merged = mergeConfig(
    {
      baseBranch: "main",
      outputDir: ".visual-diff",
      routes: ["/"],
      capture: { headless: true },
      diff: { failOnChange: false }
    },
    {
      baseBranch: "develop",
      routes: ["/", "/pricing"],
      headless: false,
      outputDir: "tmp/report",
      failOnChange: true
    }
  );

  assert.deepEqual(merged.routes, ["/", "/pricing"]);
  assert.equal(merged.baseBranch, "develop");
  assert.equal(merged.capture.headless, false);
  assert.equal(merged.outputDir, "tmp/report");
  assert.equal(merged.diff.failOnChange, true);
});

test("normalizeRouteEntry supports route assertion objects", () => {
  assert.deepEqual(normalizeRouteEntry({ path: "dashboard", expectUrl: "/dashboard" }), {
    path: "/dashboard",
    expectUrl: "/dashboard"
  });
});

test("normalizeRouteEntry preserves absolute expected URLs", () => {
  assert.deepEqual(normalizeRouteEntry({ path: "/dashboard", expectUrl: "http://127.0.0.1:3000/login" }), {
    path: "/dashboard",
    expectUrl: "http://127.0.0.1:3000/login"
  });
});
