import { useMemo } from 'react';

import { useSelector } from 'app/store';
import {
  useLifiEvmChainTokensMetadataSelector,
  useLifiEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { toTokenSlug } from 'lib/assets';
import { toChainAssetSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { TempleChainKind } from 'temple/types';

export const useLifiEvmTokensSlugs = (chainId: number) => {
  const { metadata: lifiEvmTokensMetadataRecord, isLoading } = useLifiEvmChainTokensMetadataSelector(chainId);

  const lifiTokenSlugs = useMemo(
    () => Object.values(lifiEvmTokensMetadataRecord ?? []).map(token => toTokenSlug(token.address, 0)),
    [lifiEvmTokensMetadataRecord]
  );

  return {
    isLoading,
    lifiTokenSlugs
  };
};

export const useLifiEvmAllTokensSlugs = () => {
  const metadataRecord = useLifiEvmTokensMetadataRecordSelector();
  const isLoading = useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.isLoading);

  const lifiTokenSlugs = useMemo(() => {
    return Object.entries(metadataRecord).flatMap(([chainIdStr, tokensBySlug]) => {
      const chainId = Number(chainIdStr);
      return Object.values(tokensBySlug).map(token => {
        const evmTokenSlug = token.address === EVM_ZERO_ADDRESS ? 'eth' : toTokenSlug(token.address, 0);
        return toChainAssetSlug(TempleChainKind.EVM, chainId, evmTokenSlug);
      });
    });
  }, [metadataRecord]);

  return {
    isLoading,
    lifiTokenSlugs
  };
};
