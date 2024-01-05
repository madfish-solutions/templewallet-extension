import { useCallback, useState } from 'react';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

const ACCOUNT_SELECT_HOTKEY = {
  key: 'k' as const,
  modifierKey: 'command' as const
};

export const useAccountSelectShortcut = () => {
  const [opened, setOpened] = useState(false);

  const handleShortcutPress = useCallback((e: KeyboardEvent) => {
    if (e.key !== ACCOUNT_SELECT_HOTKEY.key) return;

    e.preventDefault();

    setOpened(prev => !prev);
  }, []);

  useKeyboardShortcut(handleShortcutPress, ACCOUNT_SELECT_HOTKEY.modifierKey);

  return { opened, setOpened };
};
