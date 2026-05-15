# mobile-app

React Native application — the Student app for the GoMaths MVP.

## Scope (MVP)
- Auth + grade selection
- Curriculum browser (Grade 9 only at MVP)
- AI Tutor chat
- Scan Solver (camera → solution)
- Progress dashboard

## Stack (per `docs/Development_Strategy.md`)
- React Native + TypeScript
- Zustand (state)
- React Navigation
- Reanimated
- KaTeX for math rendering
- SQLite for local cache (offline-readable lessons)

## Status
Not yet scaffolded. Initialise with `npx react-native@latest init GoMathsApp --template react-native-template-typescript` once MVP scope is signed off.

## Target devices
- Android 8+ (priority)
- iOS 14+
- Entry-level Android (2GB RAM) is the perf target.
