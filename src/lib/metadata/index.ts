import { useCallback, useEffect, useRef } from 'react';

import { isString } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadCollectiblesMetadataAction } from 'app/store/collectibles-metadata/actions';
import {
  useCollectiblesMetadataLoadingSelector,
  useAllCollectiblesMetadataSelector,
  useCollectibleMetadataSelector
} from 'app/store/collectibles-metadata/selectors';
import { loadTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import {
  useTokenMetadataSelector,
  useTokensMetadataLoadingSelector,
  useAllTokensMetadataSelector
} from 'app/store/tokens-metadata/selectors';
import { METADATA_API_LOAD_CHUNK_SIZE } from 'lib/apis/temple';
import { isTezAsset } from 'lib/assets';
import { useNetwork } from 'lib/temple/front';
import { isTruthy } from 'lib/utils';

import { TEZOS_METADATA, FILM_METADATA } from './defaults';
import { AssetMetadataBase, TokenMetadata } from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { TEZOS_METADATA, EMPTY_BASE_METADATA } from './defaults';

export const useGasTokenMetadata = () => {
  const network = useNetwork();

  return network.type === 'dcp' ? FILM_METADATA : TEZOS_METADATA;
};

export const useAssetMetadata = (slug: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const collectibleMetadata = useCollectibleMetadataSelector(slug);
  const gasMetadata = useGasTokenMetadata();

  return isTezAsset(slug) ? gasMetadata : tokenMetadata || collectibleMetadata;
};

export type TokenMetadataGetter = (slug: string) => TokenMetadata | undefined;

export const useGetTokenMetadata = () => {
  const allMeta = useAllTokensMetadataSelector();

  return useCallback<TokenMetadataGetter>(slug => allMeta[slug], [allMeta]);
};

export const useGetTokenOrGasMetadata = () => {
  const getTokenMetadata = useGetTokenMetadata();
  const gasMetadata = useGasTokenMetadata();

  return useCallback(
    (slug: string): AssetMetadataBase | undefined => (isTezAsset(slug) ? gasMetadata : getTokenMetadata(slug)),
    [getTokenMetadata, gasMetadata]
  );
};

export const useGetCollectibleMetadata = () => {
  const allMeta = useAllCollectiblesMetadataSelector();

  return useCallback<TokenMetadataGetter>(slug => allMeta.get(slug), [allMeta]);
};

export const useGetAssetMetadata = () => {
  const getTokenOrGasMetadata = useGetTokenOrGasMetadata();
  const getCollectibleMetadata = useGetCollectibleMetadata();

  return useCallback(
    (slug: string) => getTokenOrGasMetadata(slug) || getCollectibleMetadata(slug),
    [getTokenOrGasMetadata, getCollectibleMetadata]
  );
};

/**
 * @param slugsToCheck // Memoize
 */
export const useTokensMetadataPresenceCheck = (slugsToCheck?: string[]) => {
  const metadataLoading = useTokensMetadataLoadingSelector();
  const getMetadata = useGetTokenMetadata();

  useAssetsMetadataPresenceCheck(false, metadataLoading, getMetadata, slugsToCheck);
};

/**
 * @param slugsToCheck // Memoize
 */
export const useCollectiblesMetadataPresenceCheck = (slugsToCheck?: string[]) => {
  const metadataLoading = useCollectiblesMetadataLoadingSelector();
  const getMetadata = useGetCollectibleMetadata();

  useAssetsMetadataPresenceCheck(true, metadataLoading, getMetadata, slugsToCheck);
};

const useAssetsMetadataPresenceCheck = (
  ofCollectibles: boolean,
  metadataLoading: boolean,
  getMetadata: TokenMetadataGetter,
  slugsToCheck?: string[]
) => {
  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

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
          rpcUrl,
          slugs: missingChunk
        })
      );
    }
  }, [ofCollectibles, slugsToCheck, getMetadata, metadataLoading, dispatch, rpcUrl]);
};

export function getAssetSymbol(metadata: AssetMetadataBase | nullish, short = false) {
  if (!metadata) return '???';
  if (!short) return metadata.symbol;
  return metadata.symbol === 'tez' ? 'ꜩ' : metadata.symbol.substring(0, 5);
}

export function getAssetName(metadata: AssetMetadataBase | nullish) {
  return metadata ? metadata.name : 'Unknown Token';
}

/** Empty string for `artifactUri` counts */
export const isCollectible = (metadata: Record<string, any>) =>
  'artifactUri' in metadata && isString(metadata.artifactUri);

/**
 * @deprecated // Assertion here is not safe!
 */
export const isCollectibleTokenMetadata = (metadata: AssetMetadataBase): metadata is TokenMetadata =>
  isCollectible(metadata);
