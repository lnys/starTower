#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
VERSION="$(sed -n 's/^version: \([^+]*\).*/\1/p' pubspec.yaml)"
APP=build/ios/iphonesimulator/Runner.app
/usr/libexec/PlistBuddy -c 'Print :CFBundleSupportedPlatforms:0' "$APP/Info.plist" | grep -qx iPhoneSimulator
/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Info.plist" | grep -Fxq "$VERSION"
lipo "$APP/Runner" -verify_arch x86_64 arm64
mkdir -p release
ZIP="release/StarDomeTower-Flutter-$VERSION-ios-simulator-universal.zip"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$ZIP"
unzip -tq "$ZIP"
