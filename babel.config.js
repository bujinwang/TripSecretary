module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:@tamagui/babel-plugin', {
        config: './tamagui.config.ts',
        components: ['tamagui'],
        disableExtraction: process.env.NODE_ENV === 'development',
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
