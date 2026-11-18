#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
VERSION="$(sed -n 's/^version: \([^+]*\).*/\1/p' pubspec.yaml)"
APP="build/macos/Build/Products/Release/星穹塔.app"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"
for BINARY in "Contents/MacOS/星穹塔" "Contents/Frameworks/App.framework/App" "Contents/Frameworks/FlutterMacOS.framework/FlutterMacOS"; do
  lipo "$APP/$BINARY" -verify_arch x86_64 arm64
done
mkdir -p release
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
ditto "$APP" "$STAGE/星穹塔.app"
ln -s /Applications "$STAGE/Applications"
hdiutil create -volname "星穹塔 Flutter" -srcfolder "$STAGE" -ov -format UDZO "release/StarDomeTower-Flutter-$VERSION-mac-universal.dmg"
hdiutil verify "release/StarDomeTower-Flutter-$VERSION-mac-universal.dmg"
ditto -c -k --sequesterRsrc --keepParent "$APP" "release/StarDomeTower-Flutter-$VERSION-mac-universal.zip"
unzip -tq "release/StarDomeTower-Flutter-$VERSION-mac-universal.zip"
