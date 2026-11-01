import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgress } from '../../state/ProgressContext';
import { useSettings } from '../../state/SettingsContext';
import { Palette, rounded, type, usePalette, useStyles } from '../theme';

const RULES = [
  'Tap an arrow to send it off the board in the direction it points.',
  'It only moves if nothing blocks the lane ahead of its head.',
  'A blocked tap costs a heart. Lose all three and the level restarts.',
  'Clear arrows in a row for a combo. Fewer mistakes, more stars.',
];

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const styles = useStyles(makeStyles);
  const { settings, updateSettings } = useSettings();
  const { resetProgress } = useProgress();
  const insets = useSafeAreaInsets();
  // iOS shows this as a page sheet below the status bar; Android goes full screen.
  const pad =
    Platform.OS === 'ios' ? { top: 0, bottom: 16 } : { top: insets.top, bottom: insets.bottom + 16 };

  const confirmReset = () =>
    Alert.alert('Reset progress?', 'This clears all stars, scores and unlocked levels.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetProgress },
    ]);

  return (
    <View style={[styles.root, { paddingTop: pad.top }]}>
      <View style={styles.bar}>
        <View style={styles.barSide} />
        <Text style={styles.title} accessibilityRole="header">
          Settings
        </Text>
        <Pressable
          testID="settings-close"
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Done"
          style={({ pressed }) => [styles.barSide, styles.done, pressed && styles.pressed]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: pad.bottom }]}>
        <View style={styles.group}>
          <ToggleRow
            testID="sound-switch"
            label="Sound Effects"
            value={settings.sound}
            onChange={sound => updateSettings({ sound })}
          />
          <View style={styles.separator} />
          <ToggleRow
            testID="vibration-switch"
            label="Vibration"
            value={settings.vibration}
            onChange={vibration => updateSettings({ vibration })}
          />
        </View>

        <Text style={styles.sectionHeader}>HOW TO PLAY</Text>
        <View style={styles.group}>
          {RULES.map((rule, i) => (
            <View key={rule}>
              {i > 0 && <View style={styles.separator} />}
              <Text style={styles.rule}>{rule}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.group, styles.gapAbove]}>
          <Pressable
            testID="reset-button"
            onPress={confirmReset}
            accessibilityRole="button"
            accessibilityLabel="Reset progress"
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.destructive}>Reset Progress</Text>
          </Pressable>
        </View>
        <Text style={styles.footer}>Clears stars, scores and unlocked levels on this phone.</Text>
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
  const styles = useStyles(makeStyles);
  const c = usePalette();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: '#34c759', false: c.surfaceAlt }} // iOS systemGreen
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    bar: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16 },
    barSide: { width: 72 },
    title: { flex: 1, textAlign: 'center', ...type.headline, color: c.text },
    done: { alignItems: 'flex-end', minHeight: 44, justifyContent: 'center' },
    doneText: { ...type.headline, color: c.accent },
    pressed: { opacity: 0.5 },
    content: { paddingHorizontal: 16, paddingTop: 8 },
    group: { backgroundColor: c.surface, ...rounded(12), overflow: 'hidden' },
    gapAbove: { marginTop: 32 },
    row: {
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowPressed: { backgroundColor: c.surfaceAlt },
    rowLabel: { ...type.body, color: c.text },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginLeft: 16 },
    sectionHeader: { ...type.footnote, color: c.muted, marginTop: 32, marginBottom: 6, marginLeft: 16 },
    rule: { ...type.body, color: c.text, lineHeight: 22, paddingVertical: 11, paddingHorizontal: 16 },
    destructive: { ...type.body, color: c.danger },
    footer: { ...type.footnote, color: c.muted, marginTop: 6, marginHorizontal: 16 },
  });
