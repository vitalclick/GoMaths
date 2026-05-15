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

Not yet scaffolded.
