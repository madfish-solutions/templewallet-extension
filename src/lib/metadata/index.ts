import { useCallback, useEffect, useRef } from 'react';

import { isString } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import {
  useTokenMetadataSelector,
  useTokensMetadataLoadingSelector,
  useTokensMetadataSelector
} from 'app/store/tokens-metadata/selectors';
import { METADATA_API_LOAD_CHUNK_SIZE } from 'lib/apis/temple';
import { isTezAsset } from 'lib/assets';
import { useGasToken } from 'lib/assets/hooks';
import { useNetwork } from 'lib/temple/front/ready';
import { isTruthy } from 'lib/utils';

import { TEZOS_METADATA, FILM_METADATA } from './defaults';
import { AssetMetadataBase, TokenMetadata } from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { TEZOS_METADATA, EMPTY_BASE_METADATA } from './defaults';

const useGasTokenMetadata = () => {
  const network = useNetwork();

  return network.type === 'dcp' ? FILM_METADATA : TEZOS_METADATA;
};

export const useAssetMetadata = (slug: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const gasMetadata = useGasTokenMetadata();

  return isTezAsset(slug) ? gasMetadata : tokenMetadata;
};

/**
 * @param slugsToCheck // Memoize
 */
export const useAssetsMetadataWithPresenceCheck = (slugsToCheck?: string[]) => {
  const allTokensMetadata = useTokensMetadataSelector();

  const tokensMetadataLoading = useTokensMetadataLoadingSelector();
  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (tokensMetadataLoading || !slugsToCheck?.length) return;

    const missingChunk = slugsToCheck
      .filter(
        slug =>
          !isTezAsset(slug) &&
          !isTruthy(allTokensMetadata[slug]) &&
          // In case fetched metadata is `null`
          !checkedRef.current.includes(slug)
      )
      .slice(0, 2 * METADATA_API_LOAD_CHUNK_SIZE);

    console.log('MISSING:', missingChunk);
    if (missingChunk.length > 0) {
      checkedRef.current = [...checkedRef.current, ...missingChunk];

      dispatch(
        loadTokensMetadataAction({
          rpcUrl,
          slugs: missingChunk
        })
      );
    }
  }, [slugsToCheck, allTokensMetadata, tokensMetadataLoading, dispatch, rpcUrl]);

  return allTokensMetadata;
};

export const useGetAssetMetadata = () => {
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

export function getAssetSymbol(metadata: AssetMetadataBase | nullish, short = false) {
  if (!metadata) return '???';
  if (!short) return metadata.symbol;
  return metadata.symbol === 'tez' ? 'ꜩ' : metadata.symbol.substr(0, 5);
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
