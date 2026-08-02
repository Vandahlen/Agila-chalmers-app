module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  // kar-ui-kit is a `file:` dep resolved via a symlink and ships its own
  // node_modules (react, react-native, react-native-svg, etc. from its own
  // devDependencies). Without this mapping, requires from inside
  // kar-ui-kit's code - including deep react-native/Libraries/* imports
  // and react-native-svg - can resolve to that second copy instead of this
  // repo's own, giving duplicate React instances ("Invalid hook call") and
  // duplicate native module singletons. Force all of these to always
  // resolve to this repo's copy, regardless of which package's code is
  // doing the requiring.
  moduleNameMapper: {
    '^react$': require.resolve('react'),
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-native$': require.resolve('react-native'),
    '^react-native/(.*)$': '<rootDir>/node_modules/react-native/$1',
    '^react-native-svg$': require.resolve('react-native-svg'),
  },
};
