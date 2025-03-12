import { isDefined } from '@rnw-community/shared';

import { TEZOS_METADATA } from 'lib/metadata';

import { fromTopUpTokenSlug } from './top-up-token-slug.utils';

interface AssetBase {
  code: string;
  codeToDisplay?: string;
  slug?: string;
}

export const getAssetSymbolToDisplay = (asset: AssetBase) => {
  if (asset.code.toLowerCase() === 'xtz') {
    return TEZOS_METADATA.symbol;
  }

  if (isDefined(asset.slug)) {
    return fromTopUpTokenSlug(asset.slug)[0];
  }

  return asset.codeToDisplay ?? asset.code;
};
