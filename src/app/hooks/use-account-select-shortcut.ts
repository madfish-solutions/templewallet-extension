import { useCallback, useState } from 'react';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

const ACCOUNT_SELECT_HOTKEY = {
  key: 'k' as const,
  modifierKey: 'command' as const
};

const ESC_KEY = 'Escape';

export const useAccountSelectShortcut = () => {
  const [opened, setOpened] = useState(false);

  const handleEscPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== ESC_KEY) return;

      e.preventDefault();

      if (opened) {
        setOpened(false);
      }
    },
    [opened]
  );

  const handleShortcutPress = useCallback((e: KeyboardEvent) => {
    if (e.key !== ACCOUNT_SELECT_HOTKEY.key) return;

    e.preventDefault();

    setOpened(prev => !prev);
  }, []);

  useKeyboardShortcut({
    handler: handleEscPress
  });

  useKeyboardShortcut({
    handler: handleShortcutPress,
    modifierKey: ACCOUNT_SELECT_HOTKEY.modifierKey
  });

  return { opened, setOpened };
};
