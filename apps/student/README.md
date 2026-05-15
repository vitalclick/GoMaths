# student

GoMaths Student App — the primary learner-facing application.

## Platforms
- **iOS** (14+)
- **Android** (8+, target entry-level devices, 2GB RAM)
- **Web** (evergreen browsers; ChromeOS priority for SA school computers)

Single Expo codebase across all three platforms via React Native Web.

## Stack
- Expo SDK (latest stable)
- Expo Router (file-based routing)
- TypeScript
- NativeWind (Tailwind for React Native; matches `design2` visual tokens)
- Zustand (state)
- React Query (data fetching)
- Reanimated + Moti (animations)
- KaTeX (math rendering — web) / react-native-katex equivalent (mobile)
- SQLite via Expo (offline cache)

## Scope (Phase 1 Launch)
- Auth + grade selection
- CAPS Grade 9 curriculum browser
- AI Tutor chat (text, English)
- Scan Solver (printed equations)
- Progress dashboard

## Status
Not yet scaffolded. Initialise via `pnpm create expo-app student --template` once monorepo tooling (pnpm + Turborepo) is in place.

## Source of visual truth
`UI/design2/` mockups on `main`. Translate Tailwind v4 tokens → NativeWind classes via `packages/design-tokens`.
