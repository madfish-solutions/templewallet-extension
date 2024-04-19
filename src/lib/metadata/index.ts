import { useCallback, useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { loadCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import {
  useAllCollectiblesMetadataSelector,
  useCollectibleMetadataSelector,
  useCollectiblesMetadataLoadingSelector
} from 'app/store/tezos/collectibles-metadata/selectors';
import { loadTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import {
  useTokenMetadataSelector,
  useTokensMetadataLoadingSelector,
  useAllTokensMetadataSelector
} from 'app/store/tezos/tokens-metadata/selectors';
import { METADATA_API_LOAD_CHUNK_SIZE } from 'lib/apis/temple';
import { isTezAsset } from 'lib/assets';
import { isTruthy } from 'lib/utils';
import { isTezosDcpChainId } from 'temple/networks';

import { TEZOS_METADATA, FILM_METADATA } from './defaults';
import { AssetMetadataBase, TokenMetadata } from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { isCollectible, isCollectibleTokenMetadata, getAssetSymbol, getAssetName } from './utils';

export { TEZOS_METADATA };

export const getTezosGasMetadata = (chainId: string) => (isTezosDcpChainId(chainId) ? FILM_METADATA : TEZOS_METADATA);

export const useAssetMetadata = (slug: string, tezosChainId: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const collectibleMetadata = useCollectibleMetadataSelector(slug);

  return isTezAsset(slug) ? getTezosGasMetadata(tezosChainId) : tokenMetadata || collectibleMetadata;
};

export type TokenMetadataGetter = (slug: string) => TokenMetadata | undefined;

export const useGetTokenMetadata = () => {
  const allMeta = useAllTokensMetadataSelector();

  return useCallback<TokenMetadataGetter>(slug => allMeta[slug], [allMeta]);
};

export const useGetTokenOrGasMetadata = (tezosChainId: string) => {
  const getTokenMetadata = useGetTokenMetadata();

  return useCallback(
    (slug: string): AssetMetadataBase | undefined =>
      isTezAsset(slug) ? getTezosGasMetadata(tezosChainId) : getTokenMetadata(slug),
    [getTokenMetadata, tezosChainId]
  );
};

export const useGetCollectibleMetadata = () => {
  const allMeta = useAllCollectiblesMetadataSelector();

  return useCallback<TokenMetadataGetter>(slug => allMeta.get(slug), [allMeta]);
};

export const useGetAssetMetadata = (tezosChainId: string) => {
  const getTokenOrGasMetadata = useGetTokenOrGasMetadata(tezosChainId);
  const getCollectibleMetadata = useGetCollectibleMetadata();

  return useCallback(
    (slug: string) => getTokenOrGasMetadata(slug) || getCollectibleMetadata(slug),
    [getTokenOrGasMetadata, getCollectibleMetadata]
  );
};

/**
 * @param slugsToCheck // Memoize
 */
export const useTokensMetadataPresenceCheck = (rpcBaseURL: string, slugsToCheck?: string[]) => {
  const metadataLoading = useTokensMetadataLoadingSelector();
  const getMetadata = useGetTokenMetadata();

  useAssetsMetadataPresenceCheck(rpcBaseURL, false, metadataLoading, getMetadata, slugsToCheck);
};

/**
 * @param slugsToCheck // Memoize
 */
export const useCollectiblesMetadataPresenceCheck = (rpcBaseURL: string, slugsToCheck?: string[]) => {
  const metadataLoading = useCollectiblesMetadataLoadingSelector();
  const getMetadata = useGetCollectibleMetadata();

  useAssetsMetadataPresenceCheck(rpcBaseURL, true, metadataLoading, getMetadata, slugsToCheck);
};

const useAssetsMetadataPresenceCheck = (
  rpcBaseURL: string,
  ofCollectibles: boolean,
  metadataLoading: boolean,
  getMetadata: TokenMetadataGetter,
  slugsToCheck?: string[]
) => {
  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (metadataLoading || !slugsToCheck?.length) return;

    const missingChunk = slugsToCheck
      .filter(
        slug =>
          !isTezAsset(slug) &&
          !isTruthy(getMetadata(slug)) &&
          // In case fetched metadata is `null` & won't save
          !checkedRef.current.includes(slug)
      )
      .slice(0, METADATA_API_LOAD_CHUNK_SIZE);

    if (missingChunk.length > 0) {
      checkedRef.current = [...checkedRef.current, ...missingChunk];

      dispatch(
        (ofCollectibles ? loadCollectiblesMetadataAction : loadTokensMetadataAction)({
          rpcUrl: rpcBaseURL,
          slugs: missingChunk
        })
      );
    }
  }, [ofCollectibles, slugsToCheck, getMetadata, metadataLoading, rpcBaseURL]);
};
