module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/server/'],
  modulePathIgnorePatterns: ['<rootDir>/server/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(-[a-z-]+)?|@react-native(-community)?|@react-native-async-storage|react-redux|@reduxjs/toolkit|redux|immer|reselect)/)',
  ],
};
