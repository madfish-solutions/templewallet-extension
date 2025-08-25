import { MutableRefObject, ForwardedRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { browser } from 'lib/browser';
import { toLocalFormat } from 'lib/i18n';

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

export const clearClipboard = async () => window.navigator.clipboard.writeText('').catch(error => console.error(error));

export const readClipboard = async () => {
  const allowed = await browser.permissions.request({ permissions: ['clipboardRead'] });

  if (allowed) {
    return window.navigator.clipboard.readText();
  }

  throw new Error('Clipboard read permission denied');
};

export const toPercentage = (value?: BigNumber.Value, fallback = '-', decimalPlaces = 2) =>
  isDefined(value)
    ? `${toLocalFormat(new BigNumber(value).abs().times(100), {
        decimalPlaces: Number.isFinite(decimalPlaces) ? decimalPlaces : undefined
      })}%`
    : fallback;
