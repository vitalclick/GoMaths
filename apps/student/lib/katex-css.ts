/**
 * Bundled KaTeX stylesheet — used by the in-app math renderer so lessons
 * render offline once the app is installed.
 *
 * Real CSS lives in `katex-css.bundle.ts`, which the postinstall script
 * (`scripts/bundle-katex-css.mjs`) writes from
 * `node_modules/katex/dist/katex.min.css`. That generated file is
 * gitignored. If it hasn't been generated yet (fresh clone, no install,
 * or katex not installed), this module exports an empty string and the
 * Math + LessonHtml components fall back to a CDN `<link>` at runtime.
 */

let bundled = "";
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-unresolved
  bundled = require("./katex-css.bundle").KATEX_CSS as string;
} catch {
  // bundle hasn't been generated — components use the CDN fallback.
}

export const KATEX_CSS = bundled;
