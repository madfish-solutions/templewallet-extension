import { useState, useEffect } from 'react';

import { BigNumber } from 'bignumber.js';

import { useBalancesSelector } from 'app/store/balances/selectors';
import { useAllTokensBaseMetadata } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_METADATA } from 'lib/temple/metadata';

export const useBalancesWithDecimals = () => {
  const { data: balancesRaw } = useBalancesSelector();
  const allTokensMetadata = useAllTokensBaseMetadata();

  const [balances, setBalances] = useState<Record<string, BigNumber>>({});

  useEffect(() => {
    const balancesBN: Record<string, BigNumber> = {};

    for (const tokenSlug in balancesRaw) {
      const metadata = allTokensMetadata[tokenSlug];

      if (tokenSlug !== 'tez') {
        if (metadata) {
          balancesBN[tokenSlug] = atomsToTokens(new BigNumber(balancesRaw[tokenSlug]), metadata.decimals);
        }
      } else {
        balancesBN[tokenSlug] = atomsToTokens(new BigNumber(balancesRaw[tokenSlug]), TEZOS_METADATA.decimals);
      }
    }

    setBalances(balancesBN);
  }, [balancesRaw, allTokensMetadata]);

  return balances;
};
