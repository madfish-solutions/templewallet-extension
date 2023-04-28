import browser from 'webextension-polyfill';

import type { AssetMetadataBase } from './types';

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
