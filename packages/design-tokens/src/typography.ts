/**
 * GoMaths typography tokens (ADR-008, superseding ADR-004's Sora/Inter lean).
 *
 * design1 is the canonical student-app design language — the rounded Nunito
 * family. React Native cannot pick a weight from a single custom family the
 * way the web can, so we register Nunito as per-weight families via
 * @expo-google-fonts/nunito and map the design tokens to them:
 *   - `display` → Nunito ExtraBold (headings, hero numerals)
 *   - `body`    → Nunito Regular   (copy, controls)
 *   - `mono`    → JetBrains Mono   (maths expressions)
 *
 * Apps that haven't registered these families (e.g. parent/teacher until
 * they load the fonts) fall back to the system font — no crash, no
 * regression. The student app loads them in app/_layout.tsx.
 */

export const typography = {
  family: {
    display: "Nunito_800ExtraBold",
    body: "Nunito_400Regular",
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
