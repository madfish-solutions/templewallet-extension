import { useCallback, useEffect } from 'react';

import { useAppEnv } from 'app/env';
import { useStorage } from 'lib/temple/front';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

const ACCOUNT_SELECT_HOTKEY = {
  key: 'k' as const,
  modifierKey: 'command' as const
};

export const useShortcutAccountSelectModal = (handleModalOpen?: () => void) => {
  const { popup } = useAppEnv();

  const shortcutAccountSelectModalOpenedKey = popup
    ? 'popup_shortcut_account_select_modal_opened'
    : 'fullpage_shortcut_account_select_modal_opened';

  const [opened, setOpened] = useStorage<boolean>(shortcutAccountSelectModalOpenedKey, false);

  useEffect(() => {
    if (opened && handleModalOpen) {
      handleModalOpen();
    }
  }, [opened]);

  return { opened, setOpened };
};

export const useAccountSelectShortcut = () => {
  const { opened, setOpened } = useShortcutAccountSelectModal();

  const handleShortcutPress = useCallback((e: KeyboardEvent) => {
    if (e.key !== ACCOUNT_SELECT_HOTKEY.key) return;

    e.preventDefault();

    setOpened(prev => !prev);
  }, []);

  useKeyboardShortcut(handleShortcutPress, ACCOUNT_SELECT_HOTKEY.modifierKey);

  return { opened, setOpened };
};
