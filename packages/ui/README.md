# @gomaths/ui

Shared component library across all GoMaths apps.

## Strategy
- Built on **NativeWind** so the same components compile to native (iOS/Android) and web via React Native Web
- API mirrors design2's shadcn-ish primitives: `Button`, `Card`, `Input`, `Badge`, `Progress`, `Tabs`, etc.
- Each component is a thin RN-primitive wrapper + variant props via CVA
- No platform-specific component should live here — platform splits go in apps

## What goes here vs. in an app
- **Here:** Atoms + low-level molecules (Button, Card, Input, Avatar, ProgressBar, XPChip, StreakFlame)
- **App-specific:** Screen-level compositions, navigation, feature components

## Consumers
- `apps/student`
- `apps/parent`
- `apps/teacher`
- `apps/school` (mobile companion)
- `apps/school` (web — uses same components via React Native Web)
- `apps/admin` (web — may use a Next.js-native subset; investigate trade-off)
