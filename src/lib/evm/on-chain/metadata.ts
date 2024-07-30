import axios from 'axios';
import { parseAbi, PublicClient } from 'viem';

import { NftCollectionAttribute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { fromAssetSlug } from 'lib/assets';
import { buildMetadataLinkFromUri } from 'lib/images-uri';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { EvmAssetStandard } from '../types';

import { detectEvmTokenStandard } from './utils/common.utils';

export const fetchEvmTokensMetadataFromChain = async (network: EvmChain, tokenSlugs: string[]) =>
  Promise.all(tokenSlugs.map(slug => fetchEvmTokenMetadataFromChain(network, slug))).then(fetchedMetadata =>
    handleFetchedMetadata<EvmTokenMetadata | undefined>(fetchedMetadata, tokenSlugs)
  );

export const fetchEvmCollectiblesMetadataFromChain = async (network: EvmChain, collectibleSlugs: string[]) =>
  Promise.all(collectibleSlugs.map(slug => fetchEvmCollectibleMetadataFromChain(network, slug))).then(fetchedMetadata =>
    handleFetchedMetadata<EvmCollectibleMetadata | undefined>(fetchedMetadata, collectibleSlugs)
  );

export const fetchEvmTokenMetadataFromChain = async (network: EvmChain, tokenSlug: string) => {
  const [contractAddress] = fromAssetSlug<HexString>(tokenSlug);

  const publicClient = getReadOnlyEvmForNetwork(network);

  try {
    return await getERC20Metadata(publicClient, contractAddress);
  } catch {
    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${tokenSlug}.`);

    return undefined;
  }
};

const fetchEvmCollectibleMetadataFromChain = async (network: EvmChain, collectibleSlug: string) => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(collectibleSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getReadOnlyEvmForNetwork(network);

  const standard = await detectEvmTokenStandard(network, collectibleSlug);

  try {
    switch (standard) {
      case EvmAssetStandard.ERC1155:
        return await getERC1155Metadata(publicClient, contractAddress, tokenId);
      case EvmAssetStandard.ERC721:
        return await getERC721Metadata(publicClient, contractAddress, tokenId);
      default: {
        console.error(
          `ChainId: ${network.chainId}. Slug: ${collectibleSlug}. Standard: ${standard}. Failed to load metadata. Standard is not ERC721 or ERC1155`
        );

        return undefined;
      }
    }
  } catch {
    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${collectibleSlug}.`);

    return undefined;
  }
};

const getERC20Metadata = async (publicClient: PublicClient, contractAddress: HexString) => {
  const results = await getERC20Properties(publicClient, contractAddress);

  const metadata: EvmTokenMetadata = {
    address: contractAddress,
    standard: EvmAssetStandard.ERC20,
    name: getValue<string>(results[0]),
    symbol: getValue<string>(results[1]),
    decimals: getValue<number>(results[2])
  };

  return metadata;
};

const getERC721Metadata = async (publicClient: PublicClient, contractAddress: HexString, tokenId: bigint) => {
  const results = await getERC721Properties(publicClient, contractAddress, tokenId);

  const metadataUri = getValue<string>(results[2]);

  if (!metadataUri) throw new Error();

  const collectibleMetadata = await getCollectiblePropertiesFromUri(metadataUri);

  const metadata: EvmCollectibleMetadata = {
    address: contractAddress,
    tokenId: tokenId.toString(),
    standard: EvmAssetStandard.ERC721,
    name: getValue<string>(results[0]),
    symbol: getValue<string>(results[1]),
    metadataUri,
    ...collectibleMetadata
  };

  return metadata;
};

const getERC1155Metadata = async (publicClient: PublicClient, contractAddress: HexString, tokenId: bigint) => {
  const results = await getERC1155Properties(publicClient, contractAddress, tokenId);

  const metadataUri = getValue<string>(results[2]);

  if (!metadataUri) throw new Error();

  const collectibleMetadata = await getCollectiblePropertiesFromUri(metadataUri);

  const metadata: EvmCollectibleMetadata = {
    address: contractAddress,
    tokenId: tokenId.toString(),
    standard: EvmAssetStandard.ERC1155,
    name: getValue<string>(results[0]),
    symbol: getValue<string>(results[1]),
    metadataUri,
    ...collectibleMetadata
  };

  return metadata;
};

const getCommonPromises = (publicClient: PublicClient, contractAddress: HexString): Promise<string>[] => [
  publicClient.readContract({
    address: contractAddress,
    abi: parseAbi(['function name() public view returns (string)']),
    functionName: 'name'
  }),
  publicClient.readContract({
    address: contractAddress,
    abi: parseAbi(['function symbol() public view returns (string)']),
    functionName: 'symbol'
  })
];

const getERC20Properties = async (publicClient: PublicClient, contractAddress: HexString) =>
  Promise.allSettled([
    ...getCommonPromises(publicClient, contractAddress),
    publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function decimals() public view returns (uint8)']),
      functionName: 'decimals'
    })
  ]);

const getERC721Properties = async (publicClient: PublicClient, contractAddress: HexString, tokenId: bigint) =>
  Promise.allSettled([
    ...getCommonPromises(publicClient, contractAddress),
    publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function tokenURI(uint256 _tokenId) external view returns (string)']),
      functionName: 'tokenURI',
      args: [tokenId]
    })
  ]);

const getERC1155Properties = async (publicClient: PublicClient, contractAddress: HexString, tokenId: bigint) =>
  Promise.allSettled([
    ...getCommonPromises(publicClient, contractAddress),
    publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function uri(uint256 _id) external view returns (string memory)']),
      functionName: 'uri',
      args: [tokenId]
    })
  ]);

const handleFetchedMetadata = <T>(fetchedMetadata: T[], assetSlugs: string[]) =>
  fetchedMetadata.reduce<Record<string, T | undefined>>((acc, metadata, index) => {
    const slug = assetSlugs[index];

    return { ...acc, [slug]: metadata };
  }, {});

const getValue = <T>(result: PromiseSettledResult<unknown>) =>
  result.status === 'fulfilled' ? (result.value as T) : undefined;

interface CollectibleMetadata {
  image?: string;
  name?: string;
  description?: string;
  attributes?: NftCollectionAttribute[];
  external_url?: string;
  animation_url?: string;
}

const getCollectiblePropertiesFromUri = async (
  metadataUri?: string
): Promise<
  Pick<
    EvmCollectibleMetadata,
    'image' | 'collectibleName' | 'description' | 'attributes' | 'externalUrl' | 'animationUrl'
  >
> => {
  const uri = buildMetadataLinkFromUri(metadataUri);

  if (!uri) throw new Error();

  const { data } = await axios.get<CollectibleMetadata>(uri);

  if (typeof data !== 'object' || !data.image || !data.name || !data.description) throw new Error();

  const { name, description, image, attributes, external_url: externalUrl, animation_url: animationUrl } = data;

  return {
    image,
    collectibleName: name,
    description,
    ...(attributes && { attributes }),
    ...(externalUrl && { externalUrl }),
    ...(animationUrl && { animationUrl })
  };
};
