import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerProvider, usePlayer } from './src/state/PlayerContext';
import { ProgressProvider, useProgress } from './src/state/ProgressContext';
import { SettingsProvider, useSettings } from './src/state/SettingsContext';
import { HomeScreen } from './src/ui/screens/HomeScreen';
import { LeaderboardScreen, LeaderboardTab } from './src/ui/screens/LeaderboardScreen';
import { LevelSelectScreen } from './src/ui/screens/LevelSelectScreen';
import { CampaignGame, DailyGame } from './src/ui/screens/PlayScreens';
import { usePalette } from './src/ui/theme';

type Route =
  | { name: 'home' }
  | { name: 'levels' }
  | { name: 'leaderboard'; tab?: LeaderboardTab }
  | { name: 'game'; level: number }
  | { name: 'daily'; date: string };

function App() {
  const dark = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <SettingsProvider>
        <ProgressProvider>
          <PlayerProvider>
            <Root />
          </PlayerProvider>
        </ProgressProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const c = usePalette();
  const loaded = [useProgress().loaded, useSettings().loaded, usePlayer().loaded].every(Boolean);
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const home = () => setRoute({ name: 'home' });
  const play = (level: number) => setRoute({ name: 'game', level });
  const daily = (date: string) => setRoute({ name: 'daily', date });

  // Android hardware back returns home instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') {
        return false;
      }
      setRoute({ name: 'home' });
      return true;
    });
    return () => sub.remove();
  }, [route.name]);

  const screen = () => {
    switch (route.name) {
      case 'home':
        return (
          <HomeScreen
            onPlay={play}
            onDaily={daily}
            onLevels={() => setRoute({ name: 'levels' })}
            onLeaderboard={() => setRoute({ name: 'leaderboard' })}
          />
        );
      case 'levels':
        return <LevelSelectScreen onPlay={play} onBack={home} />;
      case 'leaderboard':
        return <LeaderboardScreen initialTab={route.tab} onBack={home} onPlayDaily={daily} />;
      case 'game':
        return (
          <CampaignGame
            key={route.level}
            levelNumber={route.level}
            onNext={() => play(route.level + 1)}
            onHome={home}
          />
        );
      case 'daily':
        return (
          <DailyGame
            key={route.date}
            date={route.date}
            onLeaderboard={() => setRoute({ name: 'leaderboard', tab: 'today' })}
            onHome={home}
          />
        );
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      {loaded ? screen() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
