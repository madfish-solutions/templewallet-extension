import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { ScopedMutator } from 'swr/dist/types';

import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { isTezAsset } from 'lib/assets';
import { TOKENS_SYNC_INTERVAL } from 'lib/fixed-times';
import { isCollectible } from 'lib/metadata';
import { FILM_METADATA, TEZOS_METADATA } from 'lib/metadata/defaults';
import type { AssetMetadataBase } from 'lib/metadata/types';
import { useRetryableSWR } from 'lib/swr';
import { getStoredTokens } from 'lib/temple/assets';
import { useNetwork } from 'lib/temple/front';

const useKnownTokens = (chainId: string, account: string, fungible = true, onlyDisplayed = true) => {
  const swrResponse = useRetryableSWR(
    ['use-known-tokens', chainId, account, onlyDisplayed],
    () => getStoredTokens(chainId, account, onlyDisplayed),
    {
      revalidateOnMount: true,
      refreshInterval: TOKENS_SYNC_INTERVAL
    }
  );

  const tokensMetadata = useTokensMetadataSelector();

  const tokens = swrResponse.data;

  const data = useMemo(
    () =>
      tokens?.filter(token => {
        const metadata = tokensMetadata[token.tokenSlug];
        if (!isDefined(metadata)) return false;

        const itIsCollectible = isCollectible(metadata);

        return fungible ? !itIsCollectible : itIsCollectible;
      }) ?? [],
    [tokens, tokensMetadata, fungible]
  );

  return {
    ...swrResponse,
    data
  };
};

export const useGasToken = () => {
  const { type } = useNetwork();

  return useMemo(
    () =>
      type === 'dcp'
        ? {
            logo: 'misc/token-logos/film.png',
            symbol: 'ф',
            assetName: 'FILM',
            metadata: FILM_METADATA,
            isDcpNetwork: true
          }
        : {
            logo: 'misc/token-logos/tez.svg',
            symbol: 'ꜩ',
            assetName: 'tez',
            metadata: TEZOS_METADATA
          },
    [type]
  );
};

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

export const updateTokensSWR = async (mutate: ScopedMutator, chainId: string, account: string) => {
  await mutate(['use-known-tokens', chainId, account, true]);
  await mutate(['use-known-tokens', chainId, account, false]);
  await mutate(['use-tokens-slugs', chainId]);
};
