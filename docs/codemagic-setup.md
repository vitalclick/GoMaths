# Codemagic Setup — GoMaths

`codemagic.yaml` at the repo root drives six workflows:

| Workflow          | Trigger tag  | Output          | Publishes to            |
| ----------------- | ------------ | --------------- | ----------------------- |
| `student-ios`     | `student-v*` | `.ipa`          | TestFlight              |
| `student-android` | `student-v*` | `.aab` + `.apk` | Play **internal** track |
| `parent-ios`      | `parent-v*`  | `.ipa`          | TestFlight              |
| `parent-android`  | `parent-v*`  | `.aab` + `.apk` | Play **internal** track |
| `teacher-ios`     | `teacher-v*` | `.ipa`          | TestFlight              |
| `teacher-android` | `teacher-v*` | `.aab` + `.apk` | Play **internal** track |

The YAML and helper scripts (`scripts/codemagic/*.sh`) handle everything that can
be checked in. The rest — API keys, certificates, keystores — has to be
configured once in the Codemagic UI. Follow the steps below before triggering
your first build.

---

## 1. Connect the repository

1. Codemagic dashboard → **Add application** → GitHub → pick `vitalclick/GoMaths`.
2. When prompted for build configuration, choose **codemagic.yaml** (the file is
   already at the repo root).

## 2. iOS — App Store Connect API key

You only need to do this once; all three iOS workflows share the same key.

1. App Store Connect → **Users and Access** → **Integrations** → **App Store
   Connect API** → **+** → role **App Manager** → download the `.p8` file.
2. Codemagic → **Teams** → **Integrations** → **Developer Portal** → **App Store
   Connect** → **Add key**:
   - **Name in Codemagic:** `gomaths_appstore` ← must match `codemagic.yaml`
   - **Issuer ID:** from App Store Connect.
   - **Key ID:** from App Store Connect.
   - **Key file:** the downloaded `.p8`.
3. Create the three apps in App Store Connect (one per bundle ID) so TestFlight
   has somewhere to upload to:
   - `com.gomaths.mathai` — “GoMaths”
   - `com.gomaths.mathai.parent` — “GoMaths · Parent”
   - `com.gomaths.mathai.teacher` — “GoMaths · Teacher”
4. In each App Store Connect app → **TestFlight** → **Internal Testing** →
   create a group called **GoMaths Internal** (matches `beta_groups` in the
   YAML).

With the integration in place, Codemagic auto-creates / fetches the
distribution certificate and provisioning profile for each bundle ID on every
build — no manual `.p12` / `.mobileprovision` juggling.

## 3. Android — keystores

Generate one keystore **per app** (Play Store treats each package name as a
separate listing, and Google requires keystores to remain stable for the
lifetime of an app — keep these backed up somewhere safe outside Codemagic):

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore gomaths-student.keystore \
  -alias gomaths-student \
  -keyalg RSA -keysize 2048 -validity 36500
# Repeat with -parent / -teacher suffixes for the other two apps.
```

Upload each in Codemagic → **Teams** → **Code signing identities** →
**Android keystores** → **+**:

| Reference name             | App     | Alias             |
| -------------------------- | ------- | ----------------- |
| `gomaths_student_keystore` | student | `gomaths-student` |
| `gomaths_parent_keystore`  | parent  | `gomaths-parent`  |
| `gomaths_teacher_keystore` | teacher | `gomaths-teacher` |

Reference names must match the `android_signing:` entries in `codemagic.yaml`
exactly. Codemagic injects `CM_KEYSTORE_PATH` / `CM_KEYSTORE_PASSWORD` /
`CM_KEY_ALIAS` / `CM_KEY_PASSWORD` into the build environment;
`scripts/codemagic/prebuild-android.sh` reads those and writes them into
`android/app/build.gradle`.

## 4. Android — Google Play service account

1. Google Play Console → **Setup** → **API access** → link a Google Cloud
   project → create a service account → grant role **Service Account User** →
   create a JSON key → download.
2. Back in Play Console, grant the service account **Release manager** rights
   over the three apps.
3. Codemagic → **Teams** → **Environment variables** → group
   `google_play_credentials`:
   - **Variable name:** `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
   - **Value:** paste the full JSON.
   - **Secure:** ✔
4. Create the three Play Console apps (matching the package names above) and
   upload an initial AAB manually for each so the internal track exists.

## 5. (Optional) App Store Connect Apple IDs

If you want builds to be addressed by Apple ID instead of bundle ID, fill in
`APP_STORE_APPLE_ID` in the `vars:` block of each iOS workflow. Without it
Codemagic resolves the app via the bundle identifier, which works fine for
TestFlight.

## 6. Notification email

The YAML emails build results to `mobile@gomaths.com`. Edit the
`publishing.email.recipients` list in `codemagic.yaml` if that mailbox doesn't
exist yet.

---

## How to ship a build

The workflows are tag-driven — push doesn't build, only tags do, so day-to-day
PRs don't burn build minutes.

```bash
# Student
git tag student-v2.0.1
git push origin student-v2.0.1

# Parent
git tag parent-v2.0.1
git push origin parent-v2.0.1

# Teacher
git tag teacher-v2.0.1
git push origin teacher-v2.0.1
```

Each tag fires **both** the iOS and Android workflow for that app in parallel.

Want to trigger a one-off build without a tag? Codemagic UI → workflow → **Start
new build** → pick branch.

## Build numbers

iOS `CFBundleVersion` and Android `versionCode` are set to
`CM_BUILD_NUMBER + 1000` — Codemagic's per-workflow counter, offset so the
first cloud build is `1001` and we have headroom for any manual uploads that
might already be at low numbers. The marketing version (`CFBundleShortVersionString`
/ `versionName`) stays whatever is in `app.json`.

## Caches

Each workflow caches `node_modules`, the pnpm store, Gradle caches, and (on
iOS) the CocoaPods cache. A cold build takes ~25 min; a warm build ~12–15 min.
Clear caches from the workflow page if you change `pnpm-lock.yaml` and see
weird resolution errors.

## Troubleshooting

- **`pod install` fails on M-series with Ruby errors** → bump
  `cocoapods: default` to `cocoapods: 1.16.2` in the YAML.
- **Scheme not found** → `scripts/codemagic/prebuild-ios.sh` discovers the
  scheme dynamically. If discovery fails, run `xcodebuild -workspace … -list`
  in a Codemagic SSH session and hardcode the scheme into the YAML.
- **`./gradlew bundleRelease` fails with `SDK location not found`** → Codemagic
  Linux images preinstall the Android SDK; if this surfaces, add
  `echo "sdk.dir=$ANDROID_HOME" > local.properties` before the gradle call.
- **Play upload rejected with “Version code N has already been used”** → bump
  the Codemagic build counter on the workflow page, or change the offset in
  the `set_build_number_android` script block.
