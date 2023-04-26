import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { useBalancesSelector } from 'app/store/balances/selectors';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { GAS_TOKEN_SLUG, useAccount, useChainId, useGasToken } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';

export const useBalancesWithDecimals = () => {
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;

  const balancesRaw = useBalancesSelector(publicKeyHash, chainId);
  const allTokensMetadata = useTokensMetadataSelector();
  const { metadata: gasTokenMetadata } = useGasToken();

  return useMemo(() => {
    const balancesBN: Record<string, BigNumber> = {};

    for (const tokenSlug in balancesRaw) {
      const metadata = allTokensMetadata[tokenSlug];

      if (tokenSlug === GAS_TOKEN_SLUG) {
        balancesBN[tokenSlug] = atomsToTokens(new BigNumber(balancesRaw[tokenSlug]), gasTokenMetadata.decimals);
      } else {
        if (metadata) {
          balancesBN[tokenSlug] = atomsToTokens(new BigNumber(balancesRaw[tokenSlug]), metadata.decimals);
        }
      }
    }
    return balancesBN;
  }, [balancesRaw, allTokensMetadata, gasTokenMetadata]);
};
