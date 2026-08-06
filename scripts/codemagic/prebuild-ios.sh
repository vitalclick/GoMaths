#!/usr/bin/env bash
# Run `expo prebuild` for the target app and install CocoaPods.
# Usage: prebuild-ios.sh <app-name>
#   app-name: student | parent | teacher
set -euo pipefail

APP="${1:?app name required (student|parent|teacher)}"
APP_DIR="$CM_BUILD_DIR/apps/$APP"

if [ ! -d "$APP_DIR" ]; then
  echo "Error: $APP_DIR does not exist" >&2
  exit 1
fi

cd "$APP_DIR"

echo "==> Generating native iOS project for apps/$APP"
# --no-install: we install pods manually below so Codemagic's CocoaPods cache works
# --clean: discard any stale ios/ from a previous run
npx --yes expo prebuild --platform ios --no-install --clean

echo "==> Installing CocoaPods"
cd ios
pod install --repo-update

echo "==> Discovering Xcode workspace and scheme"
WORKSPACE=$(find . -maxdepth 1 -name "*.xcworkspace" -type d | head -1)
if [ -z "$WORKSPACE" ]; then
  echo "Error: no .xcworkspace found after prebuild" >&2
  exit 1
fi

# Derive the scheme from the app's own .xcodeproj (not the workspace's full
# scheme list). The workspace also carries CocoaPods' shared schemes (e.g.
# "boost"), and picking schemes[0] from `-list -json` can silently select
# one of those instead of the app, producing an archive with no app in it.
PROJECT=$(find . -maxdepth 1 -name "*.xcodeproj" -type d ! -name "Pods.xcodeproj" | head -1)
if [ -z "$PROJECT" ]; then
  echo "Error: no app .xcodeproj found after prebuild" >&2
  exit 1
fi
SCHEME=$(basename "$PROJECT" .xcodeproj)

echo "Workspace: $APP_DIR/ios/$WORKSPACE"
echo "Scheme:    $SCHEME"

# Surface these to subsequent Codemagic build steps
echo "XCODE_WORKSPACE=$APP_DIR/ios/$WORKSPACE" >> "$CM_ENV"
echo "XCODE_SCHEME=$SCHEME" >> "$CM_ENV"
