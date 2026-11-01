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

test('leaderboard: join with a nickname, then see your row', async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.clear();
  const me = { rank: 2, playerId: 'p-me', nickname: 'Dev', score: 120, stars: 2, durationMs: 9000 };
  const leader = { rank: 1, playerId: 'p-1', nickname: 'Ana', score: 300, stars: 3, durationMs: 5000 };
  const ok = (body: unknown) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
  globalThis.fetch = jest.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/v1/players') && init?.method === 'POST') {
      return ok({ id: 'p-me', nickname: 'Dev', token: 't0k3n' });
    }
    if (url.includes('/leaderboard')) {
      const authed = (init?.headers as Record<string, string>)?.Authorization;
      return ok({ entries: authed ? [leader, me] : [leader], me: authed ? me : null });
    }
    return ok({});
  }) as jest.Mock;

  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });
  const byId = (id: string) => root.root.findAll(n => n.props.testID === id);
  // Every string rendered as (part of) a Text's children.
  const texts = () =>
    root.root
      .findAll(n => n.props.children !== undefined)
      .flatMap(n => [n.props.children].flat())
      .filter((t): t is string => typeof t === 'string');
  for (let i = 0; i < 20 && byId('leaderboard-button').length === 0; i++) {
    await flush();
  }

  await ReactTestRenderer.act(() => byId('leaderboard-button')[0].props.onPress());
  for (let i = 0; i < 5; i++) {
    await flush();
  }
  expect(texts()).toContain('Ana');
  expect(texts()).toContain('Join the leaderboard');

  const input = byId('nickname-input').find(n => n.props.onChangeText)!;
  await ReactTestRenderer.act(() => input.props.onChangeText('ab'));
  await ReactTestRenderer.act(() => byId('join-button')[0].props.onPress());
  expect(texts()).toContain('Use 3–16 letters, numbers, spaces, _ . or -');

  await ReactTestRenderer.act(() => input.props.onChangeText('Dev'));
  await ReactTestRenderer.act(() => byId('join-button')[0].props.onPress());
  for (let i = 0; i < 5; i++) {
    await flush();
  }

  expect(texts()).toContain('Dev');
  expect(JSON.parse(await AsyncStorage.getItem('arrowswap/player/v1'))).toMatchObject({
    nickname: 'Dev',
    token: 't0k3n',
  });
});
