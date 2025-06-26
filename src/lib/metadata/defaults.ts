import { TEZOS_DCP_GAS_ICON_SRC, TEZOS_GAS_ICON_SRC } from 'lib/assets/defaults';

import type { AssetMetadataBase } from './types';

export const TEZOS_METADATA: AssetMetadataBase = {
  decimals: 6,
  symbol: 'TEZ',
  name: 'Tezos',
  thumbnailUri: TEZOS_GAS_ICON_SRC
};

export const FILM_METADATA: AssetMetadataBase = {
  decimals: 6,
  symbol: 'FILM',
  name: 'FILM',
  thumbnailUri: TEZOS_DCP_GAS_ICON_SRC
};
