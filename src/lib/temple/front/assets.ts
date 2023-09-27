import { useCallback } from 'react';

import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { isTezAsset } from 'lib/assets';
import { useGasToken } from 'lib/assets/hooks';
import type { AssetMetadataBase } from 'lib/metadata/types';

export const useGetTokenMetadata = () => {
  const allTokensMetadata = useTokensMetadataSelector();
  const { metadata } = useGasToken();

  return useCallback(
    (slug: string): AssetMetadataBase | undefined => {
      if (isTezAsset(slug)) {
        return metadata;
      }

      return allTokensMetadata[slug];
    },
    [allTokensMetadata, metadata]
  );
};
