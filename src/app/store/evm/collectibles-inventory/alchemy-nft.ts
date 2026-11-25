import { getAddress } from 'viem';

import { NftsResponse } from 'lib/apis/temple/endpoints/evm/alchemy';
import { NftTokenType } from 'lib/apis/temple/endpoints/evm/alchemy/nft-contracts';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { isSharedStorefrontTokenId } from '../collectibles-metadata/utils';

import { InventoryLoadedNft } from './place-collections';

type AlchemyOwnedNft = NftsResponse['ownedNfts'][number];

const filled = (value: string | null | undefined) => value || undefined;

const imageUrls = (nft: AlchemyOwnedNft) => {
  const { thumbnailUrl, cachedUrl, pngUrl, originalUrl } = nft.image;
  const urls: string[] = [];

  for (const url of [thumbnailUrl, cachedUrl, pngUrl, originalUrl]) {
    const value = filled(url);
    if (value) urls.push(value);
  }

  return urls;
};

export const metadataFromAlchemyNft = (nft: AlchemyOwnedNft): EvmCollectibleMetadata | undefined => {
  let address: HexString;

  try {
    address = getAddress(nft.contract.address);
  } catch {
    return undefined;
  }

  const collectionSlug = filled(nft.collection?.slug);
  const storefront = isSharedStorefrontTokenId(nft.tokenId);
  const images = imageUrls(nft);
  const standard =
    nft.tokenType === NftTokenType.ERC1155
      ? EvmAssetStandard.ERC1155
      : nft.tokenType === NftTokenType.ERC721
        ? EvmAssetStandard.ERC721
        : undefined;

  return {
    address,
    tokenId: nft.tokenId,
    standard,
    metadataUri: filled(nft.tokenUri),
    image: images[0],
    images: images.length ? images : undefined,
    collectibleName: filled(nft.name),
    name: storefront ? collectionSlug : filled(nft.collection?.name) || filled(nft.contract.name),
    openseaCollection: storefront ? collectionSlug : undefined,
    description: filled(nft.description)
  };
};

export const loadedNftFromAlchemy = (nft: AlchemyOwnedNft, slug: string): InventoryLoadedNft => ({
  slug,
  contractAddress: nft.contract.address,
  collectionSlug: filled(nft.collection?.slug),
  balance: filled(nft.balance)
});
