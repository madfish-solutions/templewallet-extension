import { MutableRefObject, ForwardedRef } from 'react';

import { browser } from 'lib/browser';

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

/** Use it only as an immediate event handler */
export const clearClipboard = async () => window.navigator.clipboard.writeText('');

export const readClipboard = async () => {
  const allowed = await browser.permissions.request({ permissions: ['clipboardRead'] });

  if (allowed) {
    return window.navigator.clipboard.readText();
  }

  throw new Error('Clipboard read permission denied');
};
