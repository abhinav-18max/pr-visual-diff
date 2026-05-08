import path from "node:path";

import { ensureDir, writeJson, writeText } from "@pr-visual-diff/core";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderResultCard(result) {
  const metricText =
    result.pixelCount === null
      ? "No image diff available"
      : `${result.pixelCount.toLocaleString()} pixels changed (${(result.diffRatio * 100).toFixed(2)}%)`;

  const errorHtml = result.error
    ? `<p class="error">${escapeHtml(result.error)}</p>`
    : "";

  const beforeImage = result.hasBefore
    ? `<img src="${escapeHtml(result.beforePath)}" alt="Before screenshot for ${escapeHtml(result.route)} ${escapeHtml(result.viewport.name)}" />`
    : `<div class="placeholder">Before screenshot unavailable</div>`;

  const afterImage = result.hasAfter
    ? `<img src="${escapeHtml(result.afterPath)}" alt="After screenshot for ${escapeHtml(result.route)} ${escapeHtml(result.viewport.name)}" />`
    : `<div class="placeholder">After screenshot unavailable</div>`;

  const diffImage = result.status === "failed"
    ? `<div class="placeholder">Diff unavailable</div>`
    : `<img src="${escapeHtml(result.diffPath)}" alt="Diff for ${escapeHtml(result.route)} ${escapeHtml(result.viewport.name)}" />`;

  return `
    <article class="card">
      <div class="card__header">
        <div>
          <h2>${escapeHtml(result.route)}</h2>
          <p>${escapeHtml(result.viewport.name)} · ${result.viewport.width}x${result.viewport.height}</p>
        </div>
        <span class="badge badge--${escapeHtml(result.status)}">${escapeHtml(result.status)}</span>
      </div>
      <p class="metric">${escapeHtml(metricText)}</p>
      ${errorHtml}
      <div class="grid">
        <figure>
          <figcaption>Before</figcaption>
          ${beforeImage}
        </figure>
        <figure>
          <figcaption>After</figcaption>
          ${afterImage}
        </figure>
        <figure>
          <figcaption>Diff</figcaption>
          ${diffImage}
        </figure>
      </div>
    </article>
  `;
}

function renderReport({ summary, results, generatedAt }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>pr-visual-diff report</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f0e8;
        --panel: #fffdf8;
        --ink: #1f1d18;
        --muted: #6e685e;
        --border: #d6cfbf;
        --changed: #a33822;
        --unchanged: #2c7a4b;
        --failed: #855d00;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        background:
          radial-gradient(circle at top left, rgba(163, 56, 34, 0.12), transparent 30%),
          radial-gradient(circle at top right, rgba(44, 122, 75, 0.12), transparent 30%),
          var(--bg);
        color: var(--ink);
      }
      main { max-width: 1200px; margin: 0 auto; padding: 40px 24px 80px; }
      header { margin-bottom: 32px; }
      h1 { margin: 0 0 8px; font-size: clamp(2rem, 5vw, 3.6rem); line-height: 0.95; }
      .lede { color: var(--muted); max-width: 700px; margin: 0; }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin: 24px 0 32px;
      }
      .summary__item, .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 12px 30px rgba(52, 43, 29, 0.08);
      }
      .summary__item { padding: 18px; }
      .summary__item strong {
        display: block;
        font-size: 2rem;
        margin-bottom: 4px;
      }
      .results { display: grid; gap: 20px; }
      .card { padding: 20px; }
      .card__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: baseline;
      }
      .card__header h2 { margin: 0; font-size: 1.4rem; }
      .card__header p, .metric { margin: 6px 0 0; color: var(--muted); }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        text-transform: capitalize;
        font-size: 0.85rem;
        border: 1px solid currentColor;
      }
      .badge--changed { color: var(--changed); }
      .badge--unchanged { color: var(--unchanged); }
      .badge--failed { color: var(--failed); }
      .grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }
      figure {
        margin: 0;
        padding: 12px;
        background: #faf7ef;
        border-radius: 14px;
        border: 1px solid var(--border);
      }
      figcaption {
        margin-bottom: 10px;
        font-size: 0.9rem;
        color: var(--muted);
      }
      img, .placeholder {
        width: 100%;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: white;
      }
      .placeholder {
        min-height: 180px;
        display: grid;
        place-items: center;
        color: var(--muted);
      }
      .error { color: var(--changed); }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Visual PR Diff Report</h1>
        <p class="lede">Generated at ${escapeHtml(generatedAt)}. Review branch-to-branch UI changes before you push or open a pull request.</p>
      </header>
      <section class="summary">
        <div class="summary__item"><strong>${summary.total}</strong><span>Total comparisons</span></div>
        <div class="summary__item"><strong>${summary.changed}</strong><span>Changed</span></div>
        <div class="summary__item"><strong>${summary.unchanged}</strong><span>Unchanged</span></div>
        <div class="summary__item"><strong>${summary.failed}</strong><span>Failed</span></div>
      </section>
      <section class="results">
        ${results.map(renderResultCard).join("\n")}
      </section>
    </main>
  </body>
</html>`;
}

export async function writeReport(outputDir, runManifest, logger) {
  const reportPath = path.join(outputDir, "report.html");
  const manifestPath = path.join(outputDir, "manifest.json");

  const summary = {
    total: runManifest.results.length,
    changed: runManifest.results.filter((item) => item.status === "changed").length,
    unchanged: runManifest.results.filter((item) => item.status === "unchanged").length,
    failed: runManifest.results.filter((item) => item.status === "failed").length
  };

  await ensureDir(outputDir);
  await writeJson(manifestPath, runManifest);
  await writeText(
    reportPath,
    renderReport({
      summary,
      results: runManifest.results,
      generatedAt: runManifest.generatedAt
    })
  );

  logger.success(`Report ready: ${reportPath}`);

  return {
    reportPath,
    manifestPath,
    summary
  };
}
