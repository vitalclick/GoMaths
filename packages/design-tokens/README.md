# @gomaths/design-tokens

Single source of truth for brand tokens — color, typography, spacing, radius, shadow, motion.

## Format

- Tokens authored in TypeScript (typed, autocompletable)
- Exported as:
  - JS objects (for runtime use in RN + web)
  - Tailwind theme extension (`tailwind.config.ts` consumer)
  - CSS variables (for Next.js admin app)

## Source

Translated from `UI/design2/src/styles.css` (oklch palette, Sora + Inter type pair).

## Locked decisions (per design review)

- **Palette:** design2's GoMaths green + warm red accent
- **Typography:** Sora (display) + Inter (body) + JetBrains Mono (math)
- **Mascot:** "Maya" (design2 naming)
- **Radius scale:** 1rem base with -4/-2/+4/+8/+12/+16 steps
