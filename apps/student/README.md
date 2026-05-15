# student

GoMaths Student App — Expo (iOS + Android + Web).

## Status (Phase 0+ prototype)

Working end-to-end demo:
- Home screen
- Topics list (Grade 9) — loads from backend if `EXPO_PUBLIC_API_URL` is set, otherwise bundled fixtures
- Topic lesson view (markdown rendering)
- Practice quiz — submits to backend's `/api/curriculum/check`, which runs the SymPy validator
- Progress screen — per-topic mastery from an in-memory store

Two real Grade 9 algebra topics: Solving Linear Equations + Laws of Exponents.

## Running

```sh
pnpm install                              # at the repo root
pnpm --filter @gomaths/student dev        # starts Expo dev server
```

Targets:
- iOS simulator: press `i`
- Android emulator: press `a`
- Web: press `w`

By default the app uses bundled fixtures so it runs without a backend. To wire to the real backend:

```sh
EXPO_PUBLIC_API_URL=http://localhost:4000 pnpm --filter @gomaths/student dev
```

Then run `services/backend-api` and `services/ai-services/validation` alongside.

## Stack
- Expo SDK 52 + Expo Router + TypeScript
- NativeWind (Tailwind v3 for RN)
- Markdown rendering: `react-native-markdown-display`
- Math rendering: TODO Phase 1 (KaTeX on web, react-native-katex on native)
- State: minimal in-memory stores (Phase 1 swaps to Zustand + SQLite)

## What's deliberately NOT here yet
- Auth (blocked on ADR-005)
- Real AI tutor UI (the backend route exists; UI shell is Phase 1)
- Camera scan solver (Phase 1)
- Onboarding flow (grade selection, parental consent — Phase 1)
- Offline persistence (Phase 1)
- Real LaTeX math rendering (Phase 1)
- Tests (Phase 1)
