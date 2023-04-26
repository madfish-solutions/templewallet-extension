import { useEffect } from 'react';

import { useDispatch } from 'react-redux';
import browser from 'webextension-polyfill';

import { loadTokenMetadataActions } from 'app/store/tokens-metadata/actions';
import { useTokenMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { isGasAsset } from 'lib/temple/assets';
import { GAS_TOKEN_SLUG, useGasToken, useNetwork } from 'lib/temple/front';

import { AssetMetadataBase, TokenMetadata } from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { TokenStandardsEnum } from './types';

export const TEZOS_METADATA: AssetMetadataBase = {
  decimals: 6,
  symbol: 'TEZ',
  name: 'Tezos',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/tez.svg')
};

export const FILM_METADATA: AssetMetadataBase = {
  decimals: 6,
  symbol: 'FILM',
  name: 'FILM',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/film.png')
};

export const EMPTY_BASE_METADATA: AssetMetadataBase = {
  decimals: 0,
  symbol: '',
  name: '',
  thumbnailUri: ''
};

export const useGasTokenMetadata = () => {
  const network = useNetwork();

  return network.type === 'dcp' ? FILM_METADATA : TEZOS_METADATA;
};

export const useAssetMetadata = (slug: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const gasMetadata = useGasTokenMetadata();

  // const dispatch = useDispatch();
  // useEffect(() => {
  //   if (!isGasAsset(slug) && !tokenMetadata) {
  //     const [address, id] = slug;
  //     dispatch(loadTokenMetadataActions.submit({ address, id: Number(id) }));
  //   }
  // }, [slug, tokenMetadata]);

  if (isGasAsset(slug)) return gasMetadata;

  return tokenMetadata;
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
