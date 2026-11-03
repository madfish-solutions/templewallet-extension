import { getAddress } from 'viem';

import { NftData, NftTokenContractBalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

export const buildEvmCollectibleMetadataFromFetched = (
  collectible: NonNullableField<NftData, 'token_id' | 'external_data' | 'token_url'>,
  contract: NftTokenContractBalanceItem
): EvmCollectibleMetadata => {
  const { image, name, description, attributes, animation_url, external_url } = collectible.external_data;

  return {
    standard: getCollectibleStandard(contract.supports_erc),
    address: getAddress(contract.contract_address),
    tokenId: collectible.token_id,
    metadataUri: collectible.token_url,
    image,
    collectibleName: name,
    description,
    name: contract.contract_name,
    symbol: contract.contract_ticker_symbol,
    ...(attributes && { attributes: attributes }),
    ...(animation_url && { animationUrl: animation_url }),
    ...(external_url && { externalUrl: external_url }),
    ...(collectible.original_owner && { originalOwner: collectible.original_owner })
  };
};

const getCollectibleStandard = (supportedErcs: string[]) => {
  if (supportedErcs.some(erc => erc === EvmAssetStandard.ERC721)) {
    return EvmAssetStandard.ERC721;
  }

  if (supportedErcs.some(erc => erc === EvmAssetStandard.ERC1155)) {
    return EvmAssetStandard.ERC1155;
  }

  return undefined;
};
