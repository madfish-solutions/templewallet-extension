import { useMemo } from 'react';

import { useLifiEvmChainTokensMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { toTokenSlug } from 'lib/assets';

export const useLifiEvmTokensSlugs = (chainId: number) => {
  const { metadata: lifiEvmTokensMetadataRecord, isLoading } = useLifiEvmChainTokensMetadataSelector(chainId);

  const lifiTokenSlugs = useMemo(
    () => Object.values(lifiEvmTokensMetadataRecord).map(token => toTokenSlug(token.address, 0)),
    [lifiEvmTokensMetadataRecord]
  );

  return {
    isLoading,
    lifiTokenSlugs
  };
};
