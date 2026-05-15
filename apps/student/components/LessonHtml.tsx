/**
 * Render a full lesson (markdown + $...$ math) as a single WebView (or
 * iframe on web).
 *
 * Math is rendered to HTML in-app via `katex.renderToString` before the
 * document is built — so the WebView/iframe only needs the KaTeX *CSS*,
 * not the KaTeX JS bundle. Combined with the bundled `katex-css.ts`,
 * this means lessons render offline once the app is installed.
 *
 * Phase 1: ship a real markdown-it pipeline (lists, tables, code blocks
 * with syntax). Phase 0+ does just enough markdown — headings,
 * paragraphs, bold/italic, math — to make the two existing lessons
 * render correctly.
 */

import { useMemo, useState } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import katex from "katex";
import { KATEX_CSS as BUNDLED_CSS } from "../lib/katex-css";

interface Props {
  markdown: string;
  style?: ViewStyle;
}

const CDN_CSS_FALLBACK = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

const PAGE_CSS = `
  html, body { margin: 0; padding: 16px 4px; background: transparent;
    color: #0E1A14; font-family: -apple-system, system-ui, sans-serif;
    font-size: 16px; line-height: 1.55; }
  h1 { font-size: 28px; font-weight: 800; margin: 18px 0 10px; letter-spacing: -0.4px; }
  h2 { font-size: 22px; font-weight: 700; margin: 22px 0 8px; letter-spacing: -0.2px; }
  h3 { font-size: 18px; font-weight: 700; margin: 16px 0 6px; }
  p { margin: 8px 0; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  ul { padding-left: 20px; margin: 8px 0; }
  li { margin: 4px 0; }
  code { font-family: ui-monospace, monospace; background: #F0F4F1; padding: 2px 4px; border-radius: 4px; }
  .katex-display { margin: 10px 0; overflow-x: auto; overflow-y: hidden; }
`;

/** Substitute `$$...$$` and `$...$` blocks with KaTeX-rendered HTML. */
function renderMathSubstitutions(html: string): string {
  // Display first ($$...$$) so $$ pairs don't get partially consumed by
  // the inline ($...$) pass.
  return html
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr: string) =>
      katex.renderToString(expr, { displayMode: true, throwOnError: false, strict: "ignore" }),
    )
    .replace(/\$([^$\n]+?)\$/g, (_, expr: string) =>
      katex.renderToString(expr, { displayMode: false, throwOnError: false, strict: "ignore" }),
    );
}

// Very small markdown → HTML converter. Phase 1 replaces with markdown-it.
function mdToHtml(md: string): string {
  let html = md.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "<em>$1</em>");

  html = html.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (_, lead, block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line: string) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("");
    return `${lead}<ul>${items}</ul>`;
  });

  html = html
    .split(/\n{2,}/)
    .map((chunk) =>
      /^\s*<(h\d|ul|ol|pre|blockquote)/.test(chunk) || chunk.trim() === ""
        ? chunk
        : `<p>${chunk.trim().replace(/\n/g, " ")}</p>`,
    )
    .join("\n");

  return renderMathSubstitutions(html);
}

function katexCssBlock(): string {
  return BUNDLED_CSS
    ? `<style>${BUNDLED_CSS}</style>`
    : `<link rel="stylesheet" href="${CDN_CSS_FALLBACK}">`;
}

function buildHtmlDoc(markdown: string): string {
  const body = mdToHtml(markdown);
  // The only script in the document is the resize-postMessage helper —
  // no external JS needed since math is pre-rendered.
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${katexCssBlock()}
  <style>${PAGE_CSS}</style>
</head>
<body>
  ${body}
  <script>
    if (window.ReactNativeWebView) {
      requestAnimationFrame(function () {
        window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
      });
    }
  </script>
</body>
</html>`;
}

export function LessonHtml({ markdown, style }: Props) {
  const html = useMemo(() => buildHtmlDoc(markdown), [markdown]);
  const [height, setHeight] = useState(800);

  if (Platform.OS === "web") {
    return (
      <iframe
        title="lesson"
        srcDoc={html}
        style={{
          width: "100%",
          height,
          border: "none",
          background: "transparent",
        }}
        onLoad={(e) => {
          const target = e.currentTarget as HTMLIFrameElement;
          try {
            const body = target.contentDocument?.body;
            if (body) setHeight(body.scrollHeight + 16);
          } catch {
            // same-origin guard — srcDoc shouldn't trip it, but be safe
          }
        }}
      />
    );
  }

  const onMessage = (event: WebViewMessageEvent) => {
    const n = Number(event.nativeEvent.data);
    if (Number.isFinite(n) && n > 100) setHeight(n + 16);
  };

  return (
    <View style={[{ height }, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}
