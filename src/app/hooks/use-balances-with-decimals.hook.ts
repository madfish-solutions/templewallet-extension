import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { useBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useAllTokensBaseMetadata, useChainId } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_METADATA } from 'lib/temple/metadata';

export const useBalancesWithDecimals = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  const balancesRaw = useBalancesSelector(publicKeyHash, chainId);
  const allTokensMetadata = useAllTokensBaseMetadata();

  return useMemo(() => {
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
    return balancesBN;
  }, [balancesRaw, allTokensMetadata]);
};
