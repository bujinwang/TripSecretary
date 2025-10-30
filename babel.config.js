module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Tamagui babel plugin temporarily disabled due to config loading issues
      // ['module:@tamagui/babel-plugin', {
      //   config: './tamagui.config.js',
      //   components: ['tamagui'],
      //   // Temporarily disable extraction until config issues are resolved
      //   disableExtraction: true,
      //   // Keep logging off for now
      //   logTimings: false,
      //   // Optimize imports
      //   importsWhitelist: ['Constants.js', 'colors.js'],
      // }],
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
