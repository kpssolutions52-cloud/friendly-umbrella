#!/usr/bin/env bash
# Build iOS artifact (simulator .app or archive)
# Requires: Xcode, CocoaPods (sudo gem install cocoapods)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_APP_DIR="$FRONTEND_DIR/ios/App"

cd "$FRONTEND_DIR"

echo "Syncing Capacitor..."
npx cap sync ios

cd "$IOS_APP_DIR"

if command -v pod &>/dev/null; then
  echo "Installing CocoaPods dependencies..."
  pod install
else
  echo "CocoaPods not found. Install with: sudo gem install cocoapods"
  exit 1
fi

# Build for simulator (no signing required) - produces .app in DerivedData
echo "Building for iOS Simulator..."
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -sdk iphonesimulator \
  -configuration Release \
  -derivedDataPath build \
  clean build

echo ""
echo "Simulator build complete. .app is at:"
echo "  $IOS_APP_DIR/build/Build/Products/Release-iphonesimulator/App.app"
echo ""
echo "To create an archive for App Store / TestFlight:"
echo "  1. Open: npx cap open ios"
echo "  2. In Xcode: Product → Archive"
echo "  3. Then: Window → Organizer → Distribute App"
