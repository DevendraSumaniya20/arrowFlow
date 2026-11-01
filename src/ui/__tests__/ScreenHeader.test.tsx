import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ScreenHeader } from '../components/ScreenHeader';

const render = (el: React.ReactElement) => {
  let root!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(el);
  });
  return root;
};

// Review finding: with `large`, nothing filled the middle, so `right` sat next to Back.
it('keeps the right slot at the edge when the title is large', () => {
  const root = render(<ScreenHeader title="Leaderboard" onBack={() => {}} large right={<Text>R</Text>} />);
  // Rendered tree: header > bar > [back, middle, right]. The middle must flex.
  const header = root.toJSON() as ReactTestRenderer.ReactTestRendererJSON;
  const bar = header.children![0] as ReactTestRenderer.ReactTestRendererJSON;
  const middle = bar.children![1] as ReactTestRenderer.ReactTestRendererJSON;
  expect([middle.props.style].flat().some(st => st?.flex === 1)).toBe(true);
});

it('names the back button after where it goes', () => {
  const root = render(<ScreenHeader title="Level 3" onBack={() => {}} backLabel="Home" />);
  expect(root.root.findAll(n => n.props.testID === 'back-button')[0].props.accessibilityLabel).toBe('Home');
});
