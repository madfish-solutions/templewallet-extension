import { browser } from 'webextension-polyfill-ts';

import { AssetMetadata } from './types';

export const TEZOS_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'tez',
  name: 'Tezos',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/tez.svg')
};
