/**
 * Tailwind preset exporting GoMaths tokens.
 * Consumed by every app's tailwind.config.{js,ts} via:
 *   import preset from "@gomaths/design-tokens/tailwind";
 *   export default { presets: [preset], content: [...] };
 */

import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { radius } from "./radius";

const preset = {
  theme: {
    extend: {
      colors: {
        background: colors.light.background,
        foreground: colors.light.foreground,
        card: colors.light.card,
        "card-foreground": colors.light.cardForeground,
        primary: {
          DEFAULT: colors.light.primary,
          foreground: colors.light.primaryForeground,
          soft: colors.light.primarySoft,
        },
        secondary: {
          DEFAULT: colors.light.secondary,
          foreground: colors.light.secondaryForeground,
        },
        muted: {
          DEFAULT: colors.light.muted,
          foreground: colors.light.mutedForeground,
        },
        accent: {
          DEFAULT: colors.light.accent,
          foreground: colors.light.accentForeground,
          soft: colors.light.accentSoft,
        },
        destructive: {
          DEFAULT: colors.light.destructive,
          foreground: colors.light.destructiveForeground,
        },
        success: {
          DEFAULT: colors.light.success,
          foreground: colors.light.successForeground,
        },
        warning: {
          DEFAULT: colors.light.warning,
          foreground: colors.light.warningForeground,
        },
        info: {
          DEFAULT: colors.light.info,
          foreground: colors.light.infoForeground,
        },
        streak: colors.light.streak,
        xp: colors.light.xp,
        border: colors.light.border,
        input: colors.light.input,
        ring: colors.light.ring,
      },
      fontFamily: {
        display: typography.family.display,
        sans: typography.family.body,
        mono: typography.family.mono,
      },
      fontSize: typography.size,
      spacing: spacing as unknown as Record<string, string | number>,
      borderRadius: radius,
    },
  },
} as const;

export default preset;
