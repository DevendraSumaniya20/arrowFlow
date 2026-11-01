import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressProvider, useProgress } from './src/state/ProgressContext';
import { SettingsProvider, useSettings } from './src/state/SettingsContext';
import { GameScreen } from './src/ui/screens/GameScreen';
import { HomeScreen } from './src/ui/screens/HomeScreen';
import { LevelSelectScreen } from './src/ui/screens/LevelSelectScreen';
import { colors } from './src/ui/theme';

type Route = { name: 'home' } | { name: 'levels' } | { name: 'game'; level: number };

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SettingsProvider>
        <ProgressProvider>
          <Root />
        </ProgressProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const progressLoaded = useProgress().loaded;
  const settingsLoaded = useSettings().loaded;
  const loaded = progressLoaded && settingsLoaded;
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const home = () => setRoute({ name: 'home' });
  const play = (level: number) => setRoute({ name: 'game', level });

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

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      {!loaded ? null : route.name === 'home' ? (
        <HomeScreen onPlay={play} onLevels={() => setRoute({ name: 'levels' })} />
      ) : route.name === 'levels' ? (
        <LevelSelectScreen onPlay={play} onBack={home} />
      ) : (
        <GameScreen
          key={route.level}
          levelNumber={route.level}
          onNext={() => play(route.level + 1)}
          onHome={home}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

export default App;
