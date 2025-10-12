#!/bin/bash
# Clean restart script for React Native app

echo "🧹 Cleaning caches..."
rm -rf node_modules/.cache
rm -rf ios/build 2>/dev/null
rm -rf android/app/build 2>/dev/null
watchman watch-del-all 2>/dev/null

echo "📦 Clearing Metro bundler cache..."
npm start -- --reset-cache &
METRO_PID=$!

echo "⏳ Waiting for Metro to start..."
sleep 5

echo "✅ Metro bundler started with clean cache (PID: $METRO_PID)"
echo ""
echo "Now rebuild your app:"
echo "  iOS: cd ios && pod install && cd .. && npx react-native run-ios"
echo "  Android: npx react-native run-android"
echo ""
echo "Or press 'i' for iOS or 'a' for Android in the Metro terminal"
