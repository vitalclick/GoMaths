/**
 * GoMaths radius scale. Base is 1rem (16px); the scale matches design2's
 * Tailwind theme inline definition.
 */
export const radius = {
  none: 0,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
