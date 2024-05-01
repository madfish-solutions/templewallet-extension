import { NftData, NftTokenContractBalanceItem } from 'lib/apis/temple/evm-data.interfaces';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

export const buildEvmCollectibleMetadataFromFetched = (
  collectible: NonNullableField<NftData, 'token_id' | 'external_data'>,
  contract: NftTokenContractBalanceItem
): EvmCollectibleMetadata => ({
  address: contract.contract_address as HexString,
  tokenId: Number(collectible.token_id),
  name: collectible.external_data.name,
  description: collectible.external_data.description,
  originalUri: collectible.external_data.image,
  thumbnailUri: collectible.external_data.image_256,
  displayUri: collectible.external_data.image_512,
  artifactUri: collectible.external_data.image_1024,
  attributes: collectible.external_data.attributes,
  mimeType: collectible.external_data.asset_mime_type
});
