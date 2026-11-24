module.exports = function(api) {
  // Use simple cache(true) - most reliable for Expo projects
  // Avoid api.env() to prevent caching configuration conflicts
  api.cache(true);
  
  const plugins = [
    ['module:@tamagui/babel-plugin', {
      config: './tamagui.config.js',
      components: ['tamagui'],
      // Enable extraction for better performance
      disableExtraction: false,
      // Keep logging off for now
      logTimings: false,
      // Optimize imports
      importsWhitelist: ['Constants.js', 'colors.js'],
    }],
    'react-native-reanimated/plugin',
  ];
  
  const presets = ['babel-preset-expo'];
  
  return {
    presets,
    plugins,
    env: {
      production: {
        plugins: [
          // Remove console statements in production builds only
          ['transform-remove-console', {
            exclude: ['error', 'warn'],
          }],
        ],
      },
      test: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
        ],
      },
    },
  };
};
