import { useEffect, useEffectEvent } from 'react';

type ModifierKey = 'ctrlKey' | 'altKey' | 'shiftKey' | 'command';
type KeyboardModifierStateKey = 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey';

const getSystemSpecificModifierKey = (modifierKey?: ModifierKey): KeyboardModifierStateKey | undefined => {
  if (modifierKey === 'command') {
    // Use Command key on Mac, Control on other platforms
    return navigator.userAgent.includes('Mac') ? 'metaKey' : 'ctrlKey';
  }

  return modifierKey;
};

export const useKeyboardShortcut = (handler: (e: KeyboardEvent) => void, modifierKey?: ModifierKey) => {
  const onKeyDown = useEffectEvent(
    (e: KeyboardEvent) => {
      const systemSpecificModifierKey = getSystemSpecificModifierKey(modifierKey);

      // If a modifierKey is specified, check if it's being held down
      if (systemSpecificModifierKey && !e[systemSpecificModifierKey]) {
        return;
      }

      handler(e);
    }
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => void document.removeEventListener('keydown', onKeyDown);
  }, []);
};
