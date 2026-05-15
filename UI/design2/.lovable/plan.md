# GoMaths — Design System + Key Screens Showcase

A mobile-first visual prototype that demonstrates the GoMaths brand and UI/UX language through a complete design system page plus the 6 highest-priority screens, all using mock data.

## Direction

**Personality:** intelligent, playful, premium EdTech — closer to Brilliant + Duolingo than a school portal. Friendly enough for a 7-year-old, credible enough for parents and schools.

**Visual language**
- Palette built from the GoMaths logo: deep green primary (success/progress), warm red accent (actions/streaks), near-black ink, off-white surface, soft mint + blush tints for cards.
- Rounded geometry (16–24px radii), soft layered shadows, subtle gradients on hero surfaces, no dark corporate vibe.
- Typography: a friendly geometric display (e.g. Sora / Space Grotesk) paired with a clean humanist body (Inter/DM Sans). Large numerals for XP, scores, and math.
- Illustration style: simple geometric math motifs (grids, parabolas, shapes), gamified badges, mascot-friendly accent characters.
- Motion: gentle spring transitions, XP bar fills, streak flame pulse, AI-solver scan sweep, lesson-complete confetti.

## Routes

```
/                    Showcase landing — links into every screen below
/design-system       Full design system reference page
/student/home        Student home dashboard
/student/solver      AI math solver (camera + steps)
/student/lesson      Learning topic / lesson screen
/student/tutor       AI tutor chat
/student/progress    Progress analytics
/parent              Parent dashboard
```

All student routes are designed mobile-first (frame previewed in a phone-sized container on desktop, full-bleed on mobile). Parent dashboard is responsive web.

## Design system page (`/design-system`)

A single scrollable reference, sectioned:
1. Brand — logo lockup placeholder, palette swatches with tokens, gradients
2. Typography — display + body scale, numeric tabular sample
3. Buttons — primary, secondary, ghost, destructive, icon, sizes, loading
4. Cards — lesson card, stat card, achievement card, AI suggestion card
5. Forms — input, select, OTP, search, toggle
6. Navigation — bottom tab bar (mobile), sidebar (web), top app bar
7. Gamification — XP bar, streak counter, badge grid, level ring, leaderboard row, quest card
8. Charts — mastery radial, progress line, topic bar (mock data via Recharts)
9. Iconography — curated Lucide set used across the product
10. States — empty, loading skeleton, success, error

Everything pulls from semantic tokens defined in `src/styles.css` (oklch).

## Key screens

**Student home** — greeting + streak flame, daily goal ring, "Continue learning" hero card, XP/coins strip, recommended lessons carousel, daily challenge, AI tutor entry, bottom tab bar.

**AI solver** — phone-frame camera viewfinder mock with detected equation overlay and scan-line animation, "Solution" sheet with step-by-step cards, "Explain like I'm 10" toggle, voice button.

**Lesson** — topic header with mastery ring, lesson outline checklist, embedded interactive example (rendered parabola/graph), "Try it" question card with multiple choice, progress footer.

**AI tutor chat** — chat thread with friendly AI bubbles, suggested prompt chips, inline rendered math, voice input button, typing indicator.

**Progress** — mastery overview, topic-by-topic bars, weak-areas list with recommended next lessons, weekly time chart, achievements grid.

**Parent dashboard** — child selector, weekly summary stats, time-spent chart, strengths/weaknesses, recent activity feed, subscription card.

## Mock data

All content (lessons, names, scores, chat messages, chart series) lives in a single `src/lib/mock-data.ts` so it's easy to tweak. No backend, no auth.

## Logo handling

You'll upload the logo next. Until then I'll use a clean text wordmark "GoMaths" with a small geometric mark, swap-ready as soon as the asset arrives.

## Out of scope (for this pass)

Teacher dashboard, admin dashboard, real auth, real AI calls, real camera, offline caching, i18n. Easy to add in follow-up turns once the system is approved.

## Technical notes

- TanStack Start route files per page, mobile-first Tailwind, shadcn components themed via tokens in `src/styles.css`.
- Recharts for analytics. Framer-motion for XP/streak/confetti micro-interactions. KaTeX (or simple SVG) for rendered math snippets.
- A `PhoneFrame` wrapper renders mobile screens inside a device shell on desktop, full-width on small viewports.
