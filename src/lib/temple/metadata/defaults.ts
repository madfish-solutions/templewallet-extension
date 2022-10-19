import browser from 'webextension-polyfill';

import { AssetMetadata } from './types';

export const TEZOS_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'TEZ',
  name: 'Tezos',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/tez.svg')
};

export const FILM_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'FILM',
  name: 'FILM',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/film.png')
};

export const EMPTY_ASSET_METADATA: AssetMetadata = {
  decimals: 0,
  symbol: '',
  name: '',
  thumbnailUri: ''
};
