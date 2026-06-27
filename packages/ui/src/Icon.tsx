import { colors } from "@gomaths/design-tokens";
import Svg, { Circle, Path, Rect } from "react-native-svg";

/**
 * Icon — the design1 stroke glyph set (`UI/design1/tokens.jsx` GMIcon),
 * ported to react-native-svg so it renders on iOS, Android and web.
 *
 * Geometric, single-weight strokes only — matches the playful-but-clean
 * design1 language. Add new glyphs by porting their path data here.
 */

export type IconName =
  | "home"
  | "book"
  | "camera"
  | "chat"
  | "chart"
  | "flame"
  | "bolt"
  | "star"
  | "check"
  | "play"
  | "arrow-right"
  | "arrow-left"
  | "profile"
  | "sparkle"
  | "lightbulb"
  | "graph"
  | "lock"
  | "trophy"
  | "clock";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Stroke width for outline glyphs. */
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = colors.light.foreground, strokeWidth = 2 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderGlyph(name, color, stroke)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: "round";
  strokeLinejoin: "round";
  fill: string;
};

function renderGlyph(name: IconName, color: string, s: StrokeProps) {
  switch (name) {
    case "home":
      return <Path {...s} d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-3v-7h-8v7H5a2 2 0 01-2-2v-9z" />;
    case "book":
      return (
        <>
          <Path {...s} d="M4 4h7a4 4 0 014 4v12a3 3 0 00-3-3H4V4z" />
          <Path {...s} d="M20 4h-7a4 4 0 00-4 4v12a3 3 0 013-3h8V4z" />
        </>
      );
    case "camera":
      return (
        <>
          <Path {...s} d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          <Circle {...s} cx={12} cy={13} r={4} />
        </>
      );
    case "chat":
      return <Path {...s} d="M21 12a8 8 0 11-3.5-6.6L21 4l-1.4 3.5A8 8 0 0121 12z" />;
    case "chart":
      return (
        <>
          <Path {...s} d="M3 21h18" />
          <Path {...s} d="M7 21V10" />
          <Path {...s} d="M12 21V4" />
          <Path {...s} d="M17 21v-7" />
        </>
      );
    case "graph":
      return (
        <>
          <Path {...s} d="M3 20V4" />
          <Path {...s} d="M3 20h18" />
          <Path {...s} d="M5 16c2-6 5-8 8-8s5 4 8 0" />
        </>
      );
    case "flame":
      return <Path {...s} d="M12 2c0 4 4 5 4 10a6 6 0 11-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3 2-5 2-7z" />;
    case "bolt":
      return <Path {...s} d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />;
    case "star":
      return <Path {...s} d="M12 3l2.6 5.3 5.9.9-4.3 4.2 1 5.9L12 16.5l-5.2 2.8 1-5.9L3.5 9.2l5.9-.9L12 3z" />;
    case "check":
      return <Path {...s} d="M5 12l4 4 10-10" />;
    case "play":
      return <Path d="M8 5v14l11-7L8 5z" fill={color} />;
    case "arrow-right":
      return <Path {...s} d="M5 12h14M13 5l7 7-7 7" />;
    case "arrow-left":
      return <Path {...s} d="M19 12H5M11 5l-7 7 7 7" />;
    case "profile":
      return (
        <>
          <Circle {...s} cx={12} cy={8} r={4} />
          <Path {...s} d="M4 21a8 8 0 0116 0" />
        </>
      );
    case "sparkle":
      return (
        <Path
          {...s}
          d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"
        />
      );
    case "lightbulb":
      return (
        <>
          <Path {...s} d="M9 18h6M10 22h4" />
          <Path {...s} d="M12 2a6 6 0 00-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0012 2z" />
        </>
      );
    case "lock":
      return (
        <>
          <Rect {...s} x={4} y={11} width={16} height={10} rx={2} />
          <Path {...s} d="M8 11V7a4 4 0 018 0v4" />
        </>
      );
    case "trophy":
      return (
        <>
          <Path {...s} d="M8 4h8v5a4 4 0 11-8 0V4z" />
          <Path {...s} d="M5 5H3v2a3 3 0 003 3" />
          <Path {...s} d="M19 5h2v2a3 3 0 01-3 3" />
          <Path {...s} d="M10 17h4v3h-4z" />
          <Path {...s} d="M8 20h8" />
        </>
      );
    case "clock":
      return (
        <>
          <Circle {...s} cx={12} cy={12} r={9} />
          <Path {...s} d="M12 7v5l3 2" />
        </>
      );
    default:
      return null;
  }
}
