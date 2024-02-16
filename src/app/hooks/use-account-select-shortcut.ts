import { useCallback, useEffect, useState } from 'react';

import constate from 'constate';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

const ACCOUNT_SELECT_HOTKEY = {
  key: 'k' as const,
  modifierKey: 'command' as const
};

const [ShortcutAccountSelectStateProvider, useShortcutAccountSelectState] = constate(() => {
  const [opened, setOpened] = useState(false);

  return { opened, setOpened };
});

export { ShortcutAccountSelectStateProvider };

export const useShortcutAccountSelectModalIsOpened = (handleModalOpen?: () => void) => {
  const { opened, setOpened } = useShortcutAccountSelectState();

  useEffect(() => {
    if (opened && handleModalOpen) {
      handleModalOpen();
    }
  }, [opened]);

  return { opened, setOpened };
};

export const useAccountSelectShortcut = () => {
  const { opened, setOpened } = useShortcutAccountSelectModalIsOpened();

  const handleShortcutPress = useCallback((e: KeyboardEvent) => {
    if (e.key !== ACCOUNT_SELECT_HOTKEY.key) return;

    e.preventDefault();

    setOpened(prev => !prev);
  }, []);

  useKeyboardShortcut(handleShortcutPress, ACCOUNT_SELECT_HOTKEY.modifierKey);

  return { opened, setOpened };
};
