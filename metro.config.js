const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { watchTamaguiConfig } = require('@tamagui/static');

const config = getDefaultConfig(__dirname);

// Ensure expo-notifications is properly resolved
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, 'cjs', 'mts', 'cts'])
);

if (process.env.NODE_ENV !== 'production') {
  const tamaguiConfigPath = path.join(__dirname, 'tamagui.config.ts');
  watchTamaguiConfig({
    config: tamaguiConfigPath,
  }).catch((error) => {
    console.warn('Unable to start Tamagui config watcher:', error);
  });
}

module.exports = config;
