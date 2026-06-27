/**
 * GoMaths color tokens (ADR-004).
 *
 * Translated from UI/design2/src/styles.css (oklch). Converted to hex so
 * React Native's color parser (which does not support oklch) can consume
 * them directly.
 *
 * Locked by ADR-004:
 *  - Primary: GoMaths green
 *  - Accent: warm red
 *  - Surfaces: near-white off-mint on light; near-black ink on dark
 */

const light = {
  background: "#fbfcf9",
  foreground: "#0a140f",

  card: "#ffffff",
  cardForeground: "#0a140f",
  popover: "#ffffff",
  popoverForeground: "#0a140f",

  primary: "#008a3e",
  primaryForeground: "#fbfcf9",
  primarySoft: "#d7f9de",

  secondary: "#ecf4ef",
  secondaryForeground: "#121e17",

  muted: "#edf3f0",
  mutedForeground: "#5a675f",

  accent: "#ea3c3f",
  accentForeground: "#fbfcf9",
  accentSoft: "#ffe2de",

  destructive: "#e62c2c",
  destructiveForeground: "#fbfcf9",

  success: "#05ab58",
  successForeground: "#fbfcf9",

  warning: "#f2a618",
  warningForeground: "#1b150c",

  info: "#2098db",
  infoForeground: "#f9fcff",

  // AI / tutor distinction (design1 — the purple used to set AI surfaces
  // apart from green "learning" surfaces). Absent from the design2-derived
  // palette; added by ADR-008.
  ai: "#7c3aed",
  aiForeground: "#fbfcf9",
  aiSoft: "#ede9fe",

  streak: "#ff6728",
  xp: "#e9ac00",

  border: "#dfe7e2",
  input: "#dfe7e2",
  ring: "#008a3e",
} as const;

const dark = {
  ...light,
  background: "#06100a",
  foreground: "#f4f6f2",
  card: "#121e17",
  cardForeground: "#f4f6f2",
  popover: "#121e17",
  popoverForeground: "#f4f6f2",
  primary: "#3aba6a",
  primaryForeground: "#06100a",
  primarySoft: "#003918",
  secondary: "#202c25",
  secondaryForeground: "#f4f6f2",
  muted: "#202c25",
  mutedForeground: "#94a29a",
  accent: "#ff5f5b",
  accentForeground: "#06100a",
  accentSoft: "#551112",
  ai: "#a78bfa",
  aiForeground: "#06100a",
  aiSoft: "#2e1065",
  border: "rgba(255,255,255,0.1)",
  input: "rgba(255,255,255,0.15)",
  ring: "#3aba6a",
} as const;

export const colors = { light, dark } as const;
export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof light;
