import React, { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Gear } from './Icons';

/** Gear button that opens settings as a sheet, so the screen below keeps its state. */
export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Pressable
        testID="settings-button"
        accessibilityRole="button"
        accessibilityLabel="Settings"
        hitSlop={12}
        onPress={() => setOpen(true)}>
        <Gear />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}>
        <SettingsScreen onClose={close} />
      </Modal>
    </>
  );
}
