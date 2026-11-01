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
// Native notifications are not available in Jest; tests drive this mock.
jest.mock('@notifee/react-native', () => {
  const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 };
  const notifee = {
    getNotificationSettings: jest.fn(async () => ({ authorizationStatus: 1 })),
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(async channel => channel.id),
    createTriggerNotification: jest.fn(async n => n.id),
    cancelTriggerNotifications: jest.fn(async () => {}),
  };
  return {
    __esModule: true,
    default: notifee,
    AuthorizationStatus,
    AndroidImportance: { DEFAULT: 3 },
    TriggerType: { TIMESTAMP: 0 },
  };
});
