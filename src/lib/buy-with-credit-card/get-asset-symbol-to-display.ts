import { TEZOS_METADATA } from 'lib/metadata';

interface AssetBase {
  code: string;
  codeToDisplay?: string;
  slug?: string;
}

export const getAssetSymbolToDisplay = (asset: AssetBase) =>
  asset.code.toLowerCase() === 'xtz' ? TEZOS_METADATA.symbol : (asset.codeToDisplay ?? asset.code);
