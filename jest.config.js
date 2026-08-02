module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  // kar-ui-kit is a `file:` dep resolved via a symlink and ships its own
  // node_modules/react + node_modules/react-native (from its own
  // devDependencies). Without this, requiring 'react'/'react-native' from
  // inside kar-ui-kit's code can resolve to that second copy instead of this
  // repo's own, giving two React copies and "Invalid hook call" crashes.
  // Force both to always resolve to this repo's copy, regardless of which
  // package's code is doing the requiring.
  moduleNameMapper: {
    '^react$': require.resolve('react'),
    '^react-native$': require.resolve('react-native'),
  },
};
