import axios from 'axios';
import { parseAbi } from 'viem';

import { NftCollectionAttribute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { fromAssetSlug } from 'lib/assets';
import { buildMetadataLinkFromUri } from 'lib/images-uri';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { EvmAssetStandard } from '../types';

import { detectEvmTokenStandard } from './utils/common.utils';

export const fetchEvmTokensMetadataFromChain = async (network: EvmChain, tokenSlugs: string[]) =>
  Promise.all(
    tokenSlugs.map(async slug => {
      return await fetchEvmTokenMetadataFromChain(network, slug);
    })
  ).then(fetchedMetadata =>
    fetchedMetadata.reduce<Record<string, EvmTokenMetadata | undefined>>((acc, metadata, index) => {
      const slug = tokenSlugs[index];

      return { ...acc, [slug]: metadata };
    }, {})
  );

export const fetchEvmCollectiblesMetadataFromChain = async (network: EvmChain, collectibleSlugs: string[]) =>
  Promise.all(
    collectibleSlugs.map(async slug => {
      return await fetchEvmCollectibleMetadataFromChain(network, slug);
    })
  ).then(fetchedMetadata =>
    fetchedMetadata.reduce<Record<string, EvmCollectibleMetadata | undefined>>((acc, metadata, index) => {
      const slug = collectibleSlugs[index];

      return { ...acc, [slug]: metadata };
    }, {})
  );

const fetchEvmTokenMetadataFromChain = async (network: EvmChain, tokenSlug: string) => {
  const [contractAddress] = fromAssetSlug<HexString>(tokenSlug);

  const publicClient = getReadOnlyEvmForNetwork(network);

  try {
    const results = await Promise.allSettled([
      publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function name() public view returns (string)']),
        functionName: 'name'
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function symbol() public view returns (string)']),
        functionName: 'symbol'
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function decimals() public view returns (uint8)']),
        functionName: 'decimals'
      })
    ]);

    const metadata: EvmTokenMetadata = {
      address: contractAddress,
      standard: EvmAssetStandard.ERC20,
      name: getValue<string>(results[0]),
      symbol: getValue<string>(results[1]),
      decimals: getValue<number>(results[2])
    };

    return metadata;
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

  const commonPromises = [
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

  try {
    if (standard === EvmAssetStandard.ERC1155) {
      const results = await Promise.allSettled([
        ...commonPromises,
        publicClient.readContract({
          address: contractAddress,
          abi: parseAbi(['function uri(uint256 _id) external view returns (string memory)']),
          functionName: 'uri',
          args: [tokenId]
        })
      ]);

      const metadataUri = getValue<string>(results[2]);

      if (!metadataUri) throw new Error();

      const collectibleMetadata = await getCollectibleMetadataFromUri(metadataUri);

      const metadata: EvmCollectibleMetadata = {
        address: contractAddress,
        tokenId: tokenIdStr ?? '0',
        standard: EvmAssetStandard.ERC1155,
        name: getValue<string>(results[0]),
        symbol: getValue<string>(results[1]),
        metadataUri,
        ...collectibleMetadata
      };

      return metadata;
    }

    if (standard === EvmAssetStandard.ERC721) {
      const results = await Promise.allSettled([
        ...commonPromises,
        publicClient.readContract({
          address: contractAddress,
          abi: parseAbi(['function tokenURI(uint256 _tokenId) external view returns (string)']),
          functionName: 'tokenURI',
          args: [tokenId]
        })
      ]);

      const metadataUri = getValue<string>(results[2]);

      if (!metadataUri) throw new Error();

      const collectibleMetadata = await getCollectibleMetadataFromUri(metadataUri);

      const metadata: EvmCollectibleMetadata = {
        address: contractAddress,
        tokenId: tokenIdStr ?? '0',
        standard: EvmAssetStandard.ERC721,
        name: getValue<string>(results[0]),
        symbol: getValue<string>(results[1]),
        metadataUri,
        ...collectibleMetadata
      };

      return metadata;
    }

    console.error(
      `ChainId: ${network.chainId}. Slug: ${collectibleSlug}. Standard: ${standard}. Failed to load metadata. Standard is not ERC721 or ERC1155`
    );

    return undefined;
  } catch {
    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${collectibleSlug}.`);

    return undefined;
  }
};

export const fetchEvmAssetMetadataFromChain = async (network: EvmChain, assetSlug: string) => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(assetSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getReadOnlyEvmForNetwork(network);

  const standard = await detectEvmTokenStandard(network, assetSlug);

  const commonPromises = [
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

  try {
    if (standard === EvmAssetStandard.ERC1155) {
      const results = await Promise.allSettled([
        ...commonPromises,
        publicClient.readContract({
          address: contractAddress,
          abi: parseAbi(['function uri(uint256 _id) external view returns (string memory)']),
          functionName: 'uri',
          args: [tokenId]
        })
      ]);

      const metadataUri = getValue<string>(results[2]);

      if (!metadataUri) throw new Error();

      const collectibleMetadata = await getCollectibleMetadataFromUri(metadataUri);

      const metadata: EvmCollectibleMetadata = {
        address: contractAddress,
        tokenId: tokenIdStr ?? '0',
        standard: EvmAssetStandard.ERC1155,
        name: getValue<string>(results[0]),
        symbol: getValue<string>(results[1]),
        metadataUri,
        ...collectibleMetadata
      };

      return metadata;
    }

    if (standard === EvmAssetStandard.ERC721) {
      const results = await Promise.allSettled([
        ...commonPromises,
        publicClient.readContract({
          address: contractAddress,
          abi: parseAbi(['function tokenURI(uint256 _tokenId) external view returns (string)']),
          functionName: 'tokenURI',
          args: [tokenId]
        })
      ]);

      const metadataUri = getValue<string>(results[2]);

      if (!metadataUri) throw new Error();

      const collectibleMetadata = await getCollectibleMetadataFromUri(metadataUri);

      const metadata: EvmCollectibleMetadata = {
        address: contractAddress,
        tokenId: tokenIdStr ?? '0',
        standard: EvmAssetStandard.ERC721,
        name: getValue<string>(results[0]),
        symbol: getValue<string>(results[1]),
        metadataUri,
        ...collectibleMetadata
      };

      return metadata;
    }

    const results = await Promise.allSettled([
      ...commonPromises,
      publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function decimals() public view returns (uint8)']),
        functionName: 'decimals'
      })
    ]);

    const metadata: EvmTokenMetadata = {
      address: contractAddress,
      standard: EvmAssetStandard.ERC20,
      name: getValue<string>(results[0]),
      symbol: getValue<string>(results[1]),
      decimals: getValue<number>(results[2])
    };

    return metadata;
  } catch {
    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${assetSlug}.`);

    return undefined;
  }
};

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

const getCollectibleMetadataFromUri = async (
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
