import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgress } from '../../state/ProgressContext';
import { useSettings } from '../../state/SettingsContext';
import { Button } from '../components/Button';
import { colors } from '../theme';

const RULES = [
  'Tap an arrow to send it off the board in the direction it points.',
  'It only moves if nothing blocks the lane ahead of its head.',
  'A blocked tap costs a heart. Lose all three and the level restarts.',
  'Clear arrows in a row for a combo. Fewer mistakes, more stars.',
];

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const { resetProgress } = useProgress();
  const insets = useSafeAreaInsets();
  // iOS shows this as a page sheet below the status bar; Android goes full screen.
  const pad = Platform.OS === 'ios' ? { top: 0, bottom: 16 } : { top: insets.top, bottom: insets.bottom + 16 };

  const confirmReset = () =>
    Alert.alert('Reset progress?', 'This clears all stars, scores and unlocked levels.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetProgress },
    ]);

  return (
    <View style={[styles.root, { paddingTop: pad.top }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Settings
        </Text>
        <Button testID="settings-close" label="Done" variant="ghost" onPress={onClose} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: pad.bottom }]}>
        <View style={styles.card}>
          <ToggleRow
            testID="sound-switch"
            label="Sound effects"
            value={settings.sound}
            onChange={sound => updateSettings({ sound })}
          />
          <View style={styles.divider} />
          <ToggleRow
            testID="vibration-switch"
            label="Vibration"
            value={settings.vibration}
            onChange={vibration => updateSettings({ vibration })}
          />
        </View>

        <Text style={styles.section}>How to play</Text>
        <View style={styles.card}>
          {RULES.map(rule => (
            <Text key={rule} style={styles.rule}>
              {rule}
            </Text>
          ))}
        </View>

        <Button
          testID="reset-button"
          label="Reset progress"
          variant="ghost"
          onPress={confirmReset}
          style={styles.reset}
        />
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  testID,
  label,
  value,
  onChange,
}: {
  testID: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  content: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { color: colors.text, fontSize: 17, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  section: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 8, marginLeft: 4 },
  rule: { color: colors.text, fontSize: 15, lineHeight: 21, paddingVertical: 8 },
  reset: { marginTop: 12 },
});
