import { useEffect, useEffectEvent, useState } from 'react';

import constate from 'constate';

import { readSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';

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

export const useShortcutAccountSelectModalIsOpened = (handleModalOpen?: EmptyFn) => {
  const { opened, setOpened } = useShortcutAccountSelectState();
  const onModalOpen = useEffectEvent(() => handleModalOpen?.());

  useEffect(() => {
    if (opened) {
      onModalOpen();
    }
  }, [opened]);

  return { opened, setOpened };
};

export const useAccountSelectShortcut = () => {
  const { opened, setOpened } = useShortcutAccountSelectModalIsOpened();

  useKeyboardShortcut(e => {
    if (e.key !== ACCOUNT_SELECT_HOTKEY.key) return;

    e.preventDefault();

    if (readSearchParamsBoolean('accountsModal')) return;

    setOpened(prev => !prev);
  }, ACCOUNT_SELECT_HOTKEY.modifierKey);

  return { opened, setOpened };
};
