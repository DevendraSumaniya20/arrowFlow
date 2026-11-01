/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-audio-api', () => {
  const mock = require('react-native-audio-api/mock');
  // The library mock (0.13.6) has no session API; the app calls it once.
  mock.AudioManager.setAudioSessionOptions = () => {};
  return mock;
});
