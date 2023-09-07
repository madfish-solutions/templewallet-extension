import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import {
  useTokenMetadataSelector,
  useTokensMetadataLoadingSelector,
  useTokensMetadataSelector
} from 'app/store/tokens-metadata/selectors';
import { isTezAsset } from 'lib/assets';
import { useNetwork } from 'lib/temple/front';
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

  if (isTezAsset(slug)) return gasMetadata;

  return tokenMetadata;
};

export const useTokensMetadataWithPresenceCheck = (slugsToCheck?: string[]) => {
  const allTokensMetadata = useTokensMetadataSelector();

  const tokensMetadataLoading = useTokensMetadataLoadingSelector();
  const { rpcBaseURL: rpcUrl } = useNetwork();
  const dispatch = useDispatch();

  useEffect(() => {
    if (tokensMetadataLoading || !slugsToCheck?.length) return;

    const metadataMissingAssetsSlugs = slugsToCheck.filter(
      slug => !isTezAsset(slug) && !isTruthy(allTokensMetadata[slug])
    );

    if (metadataMissingAssetsSlugs.length > 0) {
      dispatch(loadTokensMetadataAction({ rpcUrl, slugs: metadataMissingAssetsSlugs }));
    }
  }, [slugsToCheck, allTokensMetadata, tokensMetadataLoading, dispatch, rpcUrl]);

  return allTokensMetadata;
};

export function getAssetSymbol(metadata: AssetMetadataBase | nullish, short = false) {
  if (!metadata) return '???';
  if (!short) return metadata.symbol;
  return metadata.symbol === 'tez' ? 'ꜩ' : metadata.symbol.substr(0, 5);
}

export function getAssetName(metadata: AssetMetadataBase | nullish) {
  return metadata ? metadata.name : 'Unknown Token';
}

export const isCollectible = (metadata: AssetMetadataBase): metadata is TokenMetadata =>
  'artifactUri' in metadata && Boolean((metadata as TokenMetadata).artifactUri);
