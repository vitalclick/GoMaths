/**
 * Cross-platform math renderer.
 *
 * Renders a LaTeX string via KaTeX. On web we drop into a raw <div> with
 * `dangerouslySetInnerHTML` (react-native-web allows it). On native we
 * use a small WebView so iOS and Android get the same KaTeX output.
 *
 * Phase 1 notes:
 *  - Inline `<Math>` use in chat creates one WebView per math chunk on
 *    native. For long chat threads, consider rendering whole messages
 *    as a single WebView (one round-trip to JS bridge instead of N).
 *  - KaTeX CSS is loaded from a CDN in the WebView HTML for the
 *    prototype. Production should bundle katex.min.css locally.
 */

import { createElement, useMemo } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import katex from "katex";

export interface MathProps {
  latex: string;
  display?: boolean;
  fontSize?: number;
}

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

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
    <link rel="stylesheet" href="${KATEX_CSS}">
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
