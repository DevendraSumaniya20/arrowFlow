/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

const flush = () => ReactTestRenderer.act(() => new Promise<void>(r => setTimeout(r, 0)));

test('home loads saved progress and opens level 1', async () => {
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });
  // Wait for saved progress to load from AsyncStorage.
  const byId = (id: string) => root.root.findAll(n => n.props.testID === id);
  for (let i = 0; i < 20 && byId('play-button').length === 0; i++) {
    await flush();
  }

  await ReactTestRenderer.act(() => byId('play-button')[0].props.onPress());

  expect(byId('board').length).toBeGreaterThan(0);
  expect(byId('arrow-free').length).toBeGreaterThan(0);
  expect(byId('arrow-blocked').length).toBeGreaterThan(0);
});

test('settings toggles are saved to storage', async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });
  const byId = (id: string) => root.root.findAll(n => n.props.testID === id);
  for (let i = 0; i < 20 && byId('settings-button').length === 0; i++) {
    await flush();
  }

  await ReactTestRenderer.act(() => byId('settings-button')[0].props.onPress());
  // First match with the public Switch API (findAll also returns host nodes).
  const sound = byId('sound-switch').find(n => n.props.onValueChange)!;
  expect(sound.props.value).toBe(true);
  await ReactTestRenderer.act(() => sound.props.onValueChange(false));
  await flush();

  expect(byId('sound-switch')[0].props.value).toBe(false);
  expect(JSON.parse(await AsyncStorage.getItem('arrowswap/settings/v1'))).toEqual({
    sound: false,
    vibration: true,
  });
});
