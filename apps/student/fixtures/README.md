# student app fixtures

Snapshot of `curriculum-data/grade-9/algebra/` files, copied here so the app
runs as a standalone demo without the backend. The runtime client at
`lib/curriculum.ts` falls back to these when `EXPO_PUBLIC_API_URL` is unset.

When the real backend is running, set `EXPO_PUBLIC_API_URL=http://localhost:4000`
(or production URL) and these files are bypassed.

**Do not edit these directly.** They are a checked-in mirror of the
source-of-truth content in `curriculum-data/`. A script will re-sync them
in Phase 1.
