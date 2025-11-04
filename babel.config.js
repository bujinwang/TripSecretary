module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
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
    ],
    env: {
      test: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
        ],
      },
    },
  };
};
