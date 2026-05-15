/**
 * Render a string that may contain inline `$...$` or display `$$...$$`
 * LaTeX, splitting the string into text and Math segments.
 *
 * Used by chat bubbles. Lesson markdown takes the WebView-rendered
 * `LessonHtml` path instead — one WebView per lesson is cheaper than
 * one per math chunk.
 */

import { Fragment } from "react";
import { Text, View, type TextStyle } from "react-native";
import { Math } from "./Math";

interface Props {
  text: string;
  style?: TextStyle;
  fontSize?: number;
}

type Segment =
  | { kind: "text"; value: string }
  | { kind: "inline"; latex: string }
  | { kind: "display"; latex: string };

const MATH = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

function split(text: string): Segment[] {
  const out: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MATH.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      out.push({ kind: "display", latex: match[1] });
    } else if (match[2] !== undefined) {
      out.push({ kind: "inline", latex: match[2] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push({ kind: "text", value: text.slice(lastIndex) });
  }
  return out.length > 0 ? out : [{ kind: "text", value: text }];
}

export function TextWithMath({ text, style, fontSize = 14 }: Props) {
  const segments = split(text);
  const hasDisplayMath = segments.some((s) => s.kind === "display");

  if (!hasDisplayMath) {
    // Pure inline — render everything in a single Text run so it wraps
    // naturally. Math nodes are nested via Text (works on web; on native
    // they fall back to a small WebView via <Math/> inside a wrapper).
    return (
      <Text style={[{ fontSize }, style]}>
        {segments.map((s, i) => {
          if (s.kind === "text") return <Fragment key={i}>{s.value}</Fragment>;
          return (
            <Text key={i} style={{ fontFamily: "monospace" }}>
              <Math latex={s.latex} fontSize={fontSize} />
            </Text>
          );
        })}
      </Text>
    );
  }

  // Mixed display + inline: use a column layout, each display math on its
  // own line.
  return (
    <View>
      {segments.map((s, i) => {
        if (s.kind === "text") {
          return (
            <Text key={i} style={[{ fontSize }, style]}>
              {s.value}
            </Text>
          );
        }
        if (s.kind === "inline") {
          return <Math key={i} latex={s.latex} fontSize={fontSize} />;
        }
        return <Math key={i} latex={s.latex} display fontSize={fontSize + 2} />;
      })}
    </View>
  );
}
