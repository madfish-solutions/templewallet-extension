import { useCallback, useEffect, useMemo } from 'react';

type ModifierKey = 'ctrlKey' | 'altKey' | 'shiftKey' | 'command';

export const useKeyboardShortcut = (handler: (e: KeyboardEvent) => void, modifierKey?: ModifierKey) => {
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

  useEffect(() => {
    document.addEventListener('keydown', modifiedHandler);

    return () => void document.removeEventListener('keydown', modifiedHandler);
  }, [modifiedHandler]);
};
