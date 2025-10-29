module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:@tamagui/babel-plugin', {
        config: './tamagui.config.ts',
        components: ['tamagui'],
        // Enable extraction for better optimization
        disableExtraction: false,
        // Enable logging to see optimization results
        logTimings: true,
        // Optimize imports
        importsWhitelist: ['Constants.js', 'colors.js'],
        // Enable flattening for better performance
        disable: false,
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
