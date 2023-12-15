import { useCallback, useEffect, useMemo } from 'react';

type ModifierKey = 'ctrlKey' | 'altKey' | 'shiftKey' | 'command';

interface KeyboardShortcutConfig {
  handler: (e: KeyboardEvent) => void;
  modifierKey?: ModifierKey;
}

export const useKeyboardShortcut = ({ handler, modifierKey }: KeyboardShortcutConfig) => {
  const systemSpecificModifierKey = useMemo(() => {
    if (modifierKey === 'command') {
      // Use Command key on Mac, Control on other platforms
      return navigator.userAgent.includes('Mac') ? 'metaKey' : 'ctrlKey';
    }
    return modifierKey;
  }, [modifierKey]);

  const modifiedHandler = useCallback(
    (e: KeyboardEvent) => {
      // If a modifierKey is specified, check if it's being held down
      if (systemSpecificModifierKey && !e[systemSpecificModifierKey]) {
        return;
      }
      handler(e);
    },
    [handler, systemSpecificModifierKey]
  );

  const addHandler = useCallback(() => document.addEventListener('keydown', modifiedHandler), [modifiedHandler]);
  const removeHandler = useCallback(() => document.removeEventListener('keydown', modifiedHandler), [modifiedHandler]);

  useEffect(() => {
    addHandler();

    return () => removeHandler();
  }, [addHandler, removeHandler]);
};
