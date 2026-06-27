/**
 * GoMaths typography tokens (ADR-008, superseding ADR-004's Sora/Inter lean).
 *
 * design1 is the canonical student-app design language. It uses a single
 * rounded family — Nunito — for both display and body, leaning on weight
 * (up to 900/black) rather than a second family for hierarchy. JetBrains
 * Mono is retained for maths expressions.
 *
 * NOTE: the font files are not bundled yet. Until an app registers Nunito
 * via expo-font, React Native falls back to the system font in the stack
 * below (same behaviour as before this change — no visual regression).
 * Font bundling (expo-font + @expo-google-fonts/nunito) is a tracked
 * follow-up; see ADR-008.
 */

export const typography = {
  family: {
    display: '"Nunito", system-ui, sans-serif',
    body: '"Nunito", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;
