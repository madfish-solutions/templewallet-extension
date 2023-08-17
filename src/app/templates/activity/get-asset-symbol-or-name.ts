import { isDefined } from '@rnw-community/shared';

import { getAssetSymbol, isCollectible } from 'lib/metadata';
import { AssetMetadataBase } from 'lib/metadata/types';

const MAX_DISPLAYED_TOKEN_SYMBOL_CHARS = 15;

export const getAssetSymbolOrName = (metadata: AssetMetadataBase | undefined) => {
  const fullSymbolOrName =
    isDefined(metadata) && isCollectible(metadata) ? metadata.name : getAssetSymbol(metadata, false);

  return fullSymbolOrName.length > MAX_DISPLAYED_TOKEN_SYMBOL_CHARS
    ? `${fullSymbolOrName.slice(0, MAX_DISPLAYED_TOKEN_SYMBOL_CHARS)}…`
    : fullSymbolOrName;
};
