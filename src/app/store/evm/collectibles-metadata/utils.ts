import { NftData, NftTokenContractBalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

export const buildEvmCollectibleMetadataFromFetched = (
  collectible: NonNullableField<NftData, 'token_id' | 'external_data' | 'token_url'>,
  contract: NftTokenContractBalanceItem
): EvmCollectibleMetadata => {
  const { image, name, description, attributes, animation_url, external_url } = collectible.external_data;

  return {
    standard: EvmAssetStandard.ERC721,
    address: contract.contract_address as HexString,
    tokenId: collectible.token_id,
    metadataUri: collectible.token_url,
    image,
    name: name ?? '???',
    description: description ?? '???',
    collectionName: contract.contract_name ?? '???',
    collectionSymbol: contract.contract_ticker_symbol ?? '???',
    ...(attributes && { attributes: attributes }),
    ...(animation_url && { animationUrl: animation_url }),
    ...(external_url && { externalUrl: external_url }),
    ...(collectible.original_owner && { originalOwner: collectible.original_owner })
  };
};
