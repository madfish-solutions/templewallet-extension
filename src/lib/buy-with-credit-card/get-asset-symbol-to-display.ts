import { TEZOS_METADATA } from 'lib/temple/metadata';

interface AssetBase {
  code: string;
  codeToDisplay?: string;
}

export const getAssetSymbolToDisplay = (asset: AssetBase) => {
  if (asset.code.toLowerCase() === 'xtz') {
    return TEZOS_METADATA.symbol;
  }

  return asset.codeToDisplay ?? asset.code;
};
