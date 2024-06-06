import { BalanceItem, BalanceNftData, NftData } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetStandard } from 'lib/evm/types';
import { AssetMetadataBase, EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';

export const isPositiveTokenBalance = (data: BalanceItem): data is NonNullableField<BalanceItem, 'balance'> =>
  Boolean(data.balance && data.balance !== '0');

export const isPositiveCollectibleBalance = (
  data: BalanceNftData
): data is NonNullableField<BalanceNftData, 'token_id' | 'token_balance'> =>
  Boolean(data.token_id && data.token_balance && data.token_balance !== '0');

export const isProperCollectibleMetadata = (
  data: NftData
): data is NonNullableField<NftData, 'token_id' | 'external_data' | 'token_url'> =>
  Boolean(
    data.token_id &&
      data.token_url &&
      data.external_data &&
      data.external_data.image &&
      data.external_data.name &&
      data.external_data.description
  );

export const isEvmNativeTokenSlug = (slug: string) => slug === EVM_TOKEN_SLUG;

export const isEvmTokenMetadata = (metadata: EvmTokenMetadata | AssetMetadataBase): metadata is EvmTokenMetadata =>
  (metadata as EvmTokenMetadata).standard !== undefined;

export const isEvmNativeOrErc20TokenMetadata = (metadata: {
  standard: EvmAssetStandard;
}): metadata is EvmTokenMetadata =>
  metadata.standard === EvmAssetStandard.ERC20 || metadata.standard === EvmAssetStandard.NATIVE;

export const isEvmCollectibleMetadata = (metadata: {
  standard: EvmAssetStandard;
}): metadata is EvmCollectibleMetadata =>
  metadata.standard === EvmAssetStandard.ERC721 || metadata.standard === EvmAssetStandard.ERC1155;
