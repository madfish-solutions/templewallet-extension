import { MutableRefObject, ForwardedRef } from 'react';

/** For that the following is not allowed by Prettier:
 * ```tsx
 * <span />
 * {' '} // Use {SPACE_CHAR} instead
 * <span />
 * ```
 */
export const SPACE_CHAR = ' ';

export const combineRefs = <E extends HTMLElement>(
  ...refs: (MutableRefObject<E | nullish> | ForwardedRef<E | null> | nullish)[]
) => {
  return (elem: E | null) => {
    for (const ref of refs)
      if (ref) {
        if (typeof ref === 'function') ref(elem);
        else ref.current = elem;
      }
  };
};

export const clearClipboard = () => {
  window.navigator.clipboard.writeText('');
};

export const readClipboard = () => window.navigator.clipboard.readText();
