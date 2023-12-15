import { useCallback } from 'react';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

const ACCOUNT_SELECT_SHORTCUT = {
  key: 'k' as const,
  modifierKey: 'command' as const
};

const ESC_KEY = 'Escape';

export const useAccountSelectShortcut = (
  isPopperOpened: boolean,
  setIsPopperOpened: (v: boolean) => void,
  togglePopperOpened: EmptyFn
) => {
  const handleEscPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== ESC_KEY) return;

      e.preventDefault();

      if (isPopperOpened) {
        setIsPopperOpened(false);
      }
    },
    [isPopperOpened, setIsPopperOpened]
  );

  const handleShortcutPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== ACCOUNT_SELECT_SHORTCUT.key) return;

      e.preventDefault();

      togglePopperOpened();
    },
    [togglePopperOpened]
  );

  useKeyboardShortcut({
    handler: handleEscPress
  });

  useKeyboardShortcut({
    handler: handleShortcutPress,
    modifierKey: ACCOUNT_SELECT_SHORTCUT.modifierKey
  });
};
