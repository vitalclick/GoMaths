/**
 * GoMaths typography tokens (ADR-004).
 *  - display: Sora — headings, hero numerals, XP/score callouts
 *  - body:    Inter — body copy, controls, labels
 *  - mono:    JetBrains Mono — math expressions, code-like content
 */

export const typography = {
  family: {
    display: '"Sora", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
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
