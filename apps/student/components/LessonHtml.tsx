/**
 * Render a full lesson (markdown + $...$ math) as a single WebView.
 *
 * Cheaper than rendering N math chunks plus a markdown parser separately.
 * The lesson markdown is converted to HTML in-app, then KaTeX in the
 * WebView auto-renders `$...$` and `$$...$$`.
 *
 * Phase 1: ship a real markdown-it pipeline (lists, tables, code blocks
 * with proper syntax). Phase 0+ does just enough markdown — headings,
 * paragraphs, bold/italic, math — to make the two existing lessons
 * render correctly.
 */

import { useEffect, useMemo, useState } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

interface Props {
  markdown: string;
  style?: ViewStyle;
}

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
const AUTO_RENDER_JS =
  "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js";

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

// Very small markdown → HTML converter. Phase 1 replaces with markdown-it.
function mdToHtml(md: string): string {
  // Escape angle brackets first to avoid HTML injection from authored text.
  let html = md.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

  // Block-level math: $$...$$ stays as-is (KaTeX auto-render handles it)
  // Headings.
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold / italic. (Naive — fine for our authored content.)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "<em>$1</em>");

  // Lists: turn lines starting with `- ` into <ul><li>…</li></ul>
  html = html.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (_, lead, block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line: string) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("");
    return `${lead}<ul>${items}</ul>`;
  });

  // Paragraphs: anything that's not already a block element.
  html = html
    .split(/\n{2,}/)
    .map((chunk) =>
      /^\s*<(h\d|ul|ol|pre|blockquote)/.test(chunk) || chunk.trim() === ""
        ? chunk
        : `<p>${chunk.trim().replace(/\n/g, " ")}</p>`,
    )
    .join("\n");

  return html;
}

function buildHtmlDoc(markdown: string): string {
  const body = mdToHtml(markdown);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${KATEX_CSS}">
  <script defer src="${KATEX_JS}"></script>
  <script defer src="${AUTO_RENDER_JS}"
    onload="renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
    if (window.ReactNativeWebView) {
      requestAnimationFrame(() =>
        window.ReactNativeWebView.postMessage(String(document.body.scrollHeight))
      );
    }"></script>
  <style>${PAGE_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

export function LessonHtml({ markdown, style }: Props) {
  const html = useMemo(() => buildHtmlDoc(markdown), [markdown]);
  const [height, setHeight] = useState(800);

  if (Platform.OS === "web") {
    // On web, inject the doc as an iframe srcDoc — gives us style isolation
    // for KaTeX without polluting the app's own CSS scope.
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
          // Phase 1: switch to ResizeObserver instead of single load measurement.
          const target = e.currentTarget as HTMLIFrameElement;
          try {
            const body = target.contentDocument?.body;
            if (body) setHeight(body.scrollHeight + 16);
          } catch {
            // cross-origin guard — shouldn't happen for srcDoc, but be safe
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
