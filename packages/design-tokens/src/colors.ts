/**
 * GoMaths color tokens.
 *
 * Translated from UI/design2/src/styles.css (oklch). All values preserved
 * exactly so the design2 mockups remain a true visual reference.
 *
 * Locked by ADR-004:
 *  - Primary: GoMaths green
 *  - Accent: warm red
 *  - Surfaces: near-white off-mint on light; near-black ink on dark
 */

const light = {
  background: "oklch(0.99 0.005 130)",
  foreground: "oklch(0.18 0.02 160)",

  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.18 0.02 160)",
  popover: "oklch(1 0 0)",
  popoverForeground: "oklch(0.18 0.02 160)",

  primary: "oklch(0.55 0.16 152)",
  primaryForeground: "oklch(0.99 0.005 130)",
  primarySoft: "oklch(0.95 0.05 152)",

  secondary: "oklch(0.96 0.01 160)",
  secondaryForeground: "oklch(0.22 0.02 160)",

  muted: "oklch(0.96 0.008 160)",
  mutedForeground: "oklch(0.5 0.02 160)",

  accent: "oklch(0.62 0.21 25)",
  accentForeground: "oklch(0.99 0.005 130)",
  accentSoft: "oklch(0.95 0.05 25)",

  destructive: "oklch(0.6 0.22 27)",
  destructiveForeground: "oklch(0.99 0.005 130)",

  success: "oklch(0.65 0.17 152)",
  successForeground: "oklch(0.99 0.005 130)",

  warning: "oklch(0.78 0.16 75)",
  warningForeground: "oklch(0.2 0.02 75)",

  info: "oklch(0.65 0.14 240)",
  infoForeground: "oklch(0.99 0.005 240)",

  streak: "oklch(0.7 0.2 40)",
  xp: "oklch(0.78 0.17 85)",

  border: "oklch(0.92 0.01 160)",
  input: "oklch(0.92 0.01 160)",
  ring: "oklch(0.55 0.16 152)",

  chart1: "oklch(0.55 0.16 152)",
  chart2: "oklch(0.62 0.21 25)",
  chart3: "oklch(0.65 0.14 240)",
  chart4: "oklch(0.78 0.17 85)",
  chart5: "oklch(0.6 0.18 300)",
} as const;

const dark = {
  ...light,
  background: "oklch(0.16 0.02 160)",
  foreground: "oklch(0.97 0.005 130)",
  card: "oklch(0.22 0.02 160)",
  cardForeground: "oklch(0.97 0.005 130)",
  popover: "oklch(0.22 0.02 160)",
  popoverForeground: "oklch(0.97 0.005 130)",
  primary: "oklch(0.7 0.16 152)",
  primaryForeground: "oklch(0.16 0.02 160)",
  primarySoft: "oklch(0.3 0.08 152)",
  secondary: "oklch(0.28 0.02 160)",
  secondaryForeground: "oklch(0.97 0.005 130)",
  muted: "oklch(0.28 0.02 160)",
  mutedForeground: "oklch(0.7 0.02 160)",
  accent: "oklch(0.7 0.2 25)",
  accentForeground: "oklch(0.16 0.02 160)",
  accentSoft: "oklch(0.3 0.1 25)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.7 0.16 152)",
} as const;

export const colors = { light, dark } as const;
export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof light;
