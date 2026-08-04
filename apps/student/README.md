# student

GoMaths Student App — Expo (iOS + Android + Web).

## Status (Phase 0+ prototype)

Working end-to-end demo:

- Auth: register / login / refresh-on-401 via secure storage
- Home dashboard (gated by auth)
- Topics list (Grade 9) — loads from backend if `EXPO_PUBLIC_API_URL` is set, otherwise bundled fixtures
- Topic lesson view (markdown rendering)
- Practice quiz — submits to backend's `/api/curriculum/check`, which runs the SymPy validator
- **Tutor chat with Maya** — real-time chat hitting `/api/tutor/messages` (backend → ai-services/tutor with the configured LLM provider). Per-message "Maths verified" badge based on the SymPy validation pipeline. Topic context auto-injected when entered from a lesson.
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

### Google / Apple sign-in

These are the primary sign-in buttons; email is the fallback beneath them.
A provider whose client ID isn't configured has its button hidden rather
than shown and failing, so the app runs fine without any of this set up.

```sh
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com
```

Every ID set here must also be listed in the backend's
`GOOGLE_OAUTH_CLIENT_IDS` — the backend rejects an ID token whose `aud`
it doesn't recognise. See `docs/Environment_Reference.md`.

Three things to know:

- **Apple needs a native build.** It uses `expo-apple-authentication`, so
  it only appears on iOS, and only in a dev-client or EAS build — not in
  Expo Go. Apple's web flow needs a separate Services ID and a server-side
  redirect handler, which this app doesn't ship.
- **Google's redirect URI differs by platform**, because Google treats a
  phone app and a web page as different client types:
  - iOS / Android: `com.gomaths.mathai:/oauthredirect` — derived from the
    bundle/package id. Google rejects an arbitrary Expo scheme here, so
    `gomaths-v2://` will *not* work.
  - Web: the page origin (e.g. `http://localhost:8081` in dev), registered
    as an authorised redirect URI on the **web** client.
- **Native uses the authorization-code grant with PKCE**, because Google
  only issues installed apps a code, never an ID token directly. PKCE is
  what makes that safe without a client secret — none ships in the bundle.
  Web uses the implicit ID-token grant.

Client IDs are inlined into the JS bundle at build time, so they must be
present when the app is *built* — setting them on the server afterwards
does nothing for an already-shipped binary. In CI they come from the
`google_oauth` Codemagic group (see `codemagic.yaml`).

First-time social sign-ups land on `/complete-profile`, because neither
provider can tell us a grade or a birth year — and POPIA still requires
parental consent for under-18s.

## Stack

- Expo SDK 52 + Expo Router + TypeScript
- NativeWind (Tailwind v3 for RN)
- Markdown rendering: `react-native-markdown-display`
- Math rendering: TODO Phase 1 (KaTeX on web, react-native-katex on native)
- State: minimal in-memory stores (Phase 1 swaps to Zustand + SQLite)

## What's deliberately NOT here yet

- Real AI tutor UI (the backend route exists; UI shell is Phase 1)
- Camera scan solver (Phase 1)
- Onboarding flow (grade selection, parental consent — Phase 1)
- Offline persistence (Phase 1)
- Real LaTeX math rendering (Phase 1)
- Tests (Phase 1)
