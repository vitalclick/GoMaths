import { colors } from "@gomaths/design-tokens";
import type { ReactNode } from "react";
import { Text, View, type ViewStyle } from "react-native";

const c = colors.light;

export type PillTone = "primary" | "accent" | "ai" | "xp" | "streak" | "muted";

/** Tone → [text colour, background colour]. design1 stat-pill palette. */
const TONES: Record<PillTone, { fg: string; bg: string }> = {
  primary: { fg: c.primary, bg: c.primarySoft },
  accent: { fg: c.accent, bg: c.accentSoft },
  ai: { fg: c.ai, bg: c.aiSoft },
  xp: { fg: "#8a6500", bg: "#fdf0c8" },
  streak: { fg: c.streak, bg: "#ffe6da" },
  muted: { fg: c.mutedForeground, bg: c.muted },
};

export interface PillProps {
  label: string;
  tone?: PillTone;
  /** Optional leading node (e.g. an icon). Keeps the lib icon-agnostic. */
  icon?: ReactNode;
  /** Override the computed text colour. */
  color?: string;
  /** Override the computed background colour. */
  background?: string;
  style?: ViewStyle;
}

/**
 * Pill — a compact stat chip (XP, streak, etc.), ported from design1's
 * `GMPill` (ADR-008). Icon-agnostic: pass any node via `icon`.
 */
export function Pill({ label, tone = "muted", icon, color, background, style }: PillProps) {
  const t = TONES[tone];
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        alignSelf: "flex-start",
        backgroundColor: background ?? t.bg,
        ...style,
      }}
    >
      {icon}
      <Text style={{ color: color ?? t.fg, fontWeight: "800", fontSize: 14, lineHeight: 16 }}>
        {label}
      </Text>
    </View>
  );
}
