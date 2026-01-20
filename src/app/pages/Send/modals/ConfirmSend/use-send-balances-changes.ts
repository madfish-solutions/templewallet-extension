import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { tokensToAtoms } from 'lib/temple/helpers';

export const useSendBalancesChanges = (assetSlug: string, amount: string, decimals = 0) => {
  return useMemo(() => {
    const atomic = tokensToAtoms(new BigNumber(amount || 0), decimals ?? 0).negated();

    return [
      {
        [assetSlug]: {
          atomicAmount: atomic,
          isNft: false
        }
      }
    ];
  }, [decimals, assetSlug, amount]);
};
