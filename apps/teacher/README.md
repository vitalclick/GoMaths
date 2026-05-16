# teacher

GoMaths Teacher App.

## Platforms

- iOS, Android, Web (Expo + Expo Web)

## Purpose

In-classroom + out-of-classroom companion for teachers using GoMaths with their learners.

## Core surfaces

- Class roster (synced from school)
- Per-student progress (mastery, time, engagement)
- Assignment creation (pick from curriculum bank or AI-generated drafts)
- Assignment grading + comments
- Classroom analytics (which topics the class struggled with)
- Announcements / messages to learners
- Lesson preview (see what students see)

## Stack

Same Expo + NativeWind + shared `packages/*` as student app.

## Web is primary, mobile is companion

Teachers will do most heavy work (assignment creation, grading) on web. Mobile is for in-class quick actions (taking attendance, viewing live engagement during a lesson, pushing a quick quiz). Build mobile UX accordingly — don't try to cram the full web feature set into a phone screen.

## Status

**Skeleton scaffolded.** Boots end-to-end with shared auth and the
design tokens. No teacher-specific endpoints are wired in the backend
yet — the index screen has placeholder cards for the surfaces above.

What ships next (in rough order):

1. Backend `teachers` module: `GET /api/teachers/me/classes`,
   `GET /api/teachers/classes/:id/students`,
   `GET /api/teachers/classes/:id/progress`.
2. Roster import endpoint + School Admin → Teacher invite linkage.
3. Assignment CRUD (table + endpoints; UI uses the curriculum bank).
4. In-classroom live view (websocket; uses the existing SSE shape).

## Running

```sh
EXPO_PUBLIC_API_URL=http://localhost:4000 \
  pnpm --filter @gomaths/teacher dev
# press `w` for web, `i` for iOS sim, `a` for Android emu
```
