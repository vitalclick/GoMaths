/**
 * Cross-platform math renderer.
 *
 * Renders a LaTeX string via KaTeX. On web we drop into a raw <span> with
 * `dangerouslySetInnerHTML` (react-native-web allows it). On native we
 * use a small WebView so iOS and Android get the same KaTeX output.
 *
 * KaTeX CSS is bundled locally via the postinstall hook in
 * `scripts/bundle-katex-css.mjs`. If the bundle is empty (the postinstall
 * hook hasn't run yet) we fall back to the CDN at runtime — the lesson
 * still renders but requires network connectivity.
 */

import { createElement, useMemo } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import katex from "katex";
import { KATEX_CSS as BUNDLED_CSS } from "../lib/katex-css";

export interface MathProps {
  latex: string;
  display?: boolean;
  fontSize?: number;
}

const CDN_FALLBACK = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

/** Inline the bundled stylesheet when available; fall back to a CDN link. */
function katexStyleBlock(): string {
  return BUNDLED_CSS
    ? `<style>${BUNDLED_CSS}</style>`
    : `<link rel="stylesheet" href="${CDN_FALLBACK}">`;
}

export function Math({ latex, display = false, fontSize = 16 }: MathProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
      }),
    [latex, display],
  );

  if (Platform.OS === "web") {
    return createElement("span", {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      dangerouslySetInnerHTML: { __html: html },
      style: {
        fontSize,
        display: display ? "block" : "inline-block",
        margin: display ? "8px 0" : 0,
      },
    });
  }

  const wrapped = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${katexStyleBlock()}
    <style>
      html, body { margin: 0; padding: 0; background: transparent; color: #0E1A14;
        font-size: ${fontSize}px; }
      .wrap { ${display ? "text-align: center; padding: 6px 0;" : "display: inline;"} }
    </style>
  </head><body><div class="wrap">${html}</div></body></html>`;

  return (
    <View style={{ minHeight: display ? fontSize * 2.4 : fontSize * 1.6 }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: wrapped }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "transparent" }}
        // eslint-disable-next-line react-native/no-inline-styles
        containerStyle={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}

export { katexStyleBlock };
