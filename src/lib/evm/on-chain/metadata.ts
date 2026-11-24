import { fromAssetSlug } from 'lib/assets';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { IpfsBackoffError, IpfsTransientError } from 'lib/utils/ipfs';
import { ChainPublicClient, getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmAssetStandard } from '../types';

import { CollectibleChainRead, readCollectibleChainFields } from './collectible-chain-reads';
import { getERC1155Properties, getERC20Properties, getERC721Properties, getValue } from './contract-properties';
import {
  fetchERC1155MetadataFile,
  fetchMetadataFileInBulk,
  fetchMetadataFileInteractively,
  getCollectiblePropertiesFromUri,
  MetadataFileFetcher
} from './metadata-file';
import { detectEvmTokenStandard } from './utils/common.utils';

const ENS_NAME_CONTRACTS: Record<number, string[]> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: ['0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85']
};

const getEnsMetadataUri = (chainId: number, contractAddress: HexString, tokenId: bigint) =>
  ENS_NAME_CONTRACTS[chainId]?.includes(contractAddress.toLowerCase())
    ? `https://metadata.ens.domains/mainnet/${contractAddress}/${tokenId}`
    : undefined;

export const fetchEvmTokensMetadataFromChain = async (network: EvmNetworkEssentials, tokenSlugs: string[]) =>
  Promise.all(tokenSlugs.map(slug => fetchEvmTokenMetadataFromChain(network, slug))).then(fetchedMetadata =>
    handleFetchedMetadata<EvmTokenMetadata | undefined>(fetchedMetadata, tokenSlugs)
  );

export const fetchEvmAssetMetadataFromChain = async (network: EvmNetworkEssentials, assetSlug: string) => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(assetSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getViemPublicClient(network);

  const standard = await detectEvmTokenStandard(network, assetSlug);

  try {
    switch (standard) {
      case EvmAssetStandard.ERC1155:
        return await getERC1155Metadata(publicClient, contractAddress, tokenId, fetchMetadataFileInteractively);
      case EvmAssetStandard.ERC721:
        return await getERC721Metadata(publicClient, contractAddress, tokenId, fetchMetadataFileInteractively);
      default:
        return await getERC20Metadata(publicClient, contractAddress);
    }
  } catch {
    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${assetSlug}.`);

    return undefined;
  }
};

export const fetchEvmTokenMetadataFromChain = async (network: EvmNetworkEssentials, tokenSlug: string) => {
  const [contractAddress] = fromAssetSlug<HexString>(tokenSlug);

  const publicClient = getViemPublicClient(network);

  try {
    return await getERC20Metadata(publicClient, contractAddress);
  } catch {
    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${tokenSlug}.`);

    return undefined;
  }
};

export const fetchEvmCollectibleMetadataFromChain = (network: EvmNetworkEssentials, collectibleSlug: string) =>
  loadEvmCollectibleMetadataFromChain(network, collectibleSlug, fetchMetadataFileInteractively);

export const fetchEvmCollectibleMetadataFromChainInBulk = (
  network: EvmNetworkEssentials,
  collectibleSlug: string,
  signal: AbortSignal
) => loadEvmCollectibleMetadataFromChain(network, collectibleSlug, uri => fetchMetadataFileInBulk(uri, signal), signal);

/**
 * One multicall reads the standard, name, symbol, and metadata URI for every slug.
 * Each metadata file is still fetched on its own.
 */
export const fetchEvmCollectiblesMetadataFromChain = async (
  network: EvmNetworkEssentials,
  collectibleSlugs: readonly string[]
) => {
  if (!collectibleSlugs.length) return [];

  const publicClient = getViemPublicClient(network);
  let chainReads: CollectibleChainRead[];

  try {
    chainReads = await readCollectibleChainFields(publicClient, collectibleSlugs);
  } catch (error) {
    console.error(error);

    return Promise.all(
      collectibleSlugs.map(
        async (slug): Promise<[string, EvmCollectibleMetadata | undefined]> =>
          [slug, await fetchEvmCollectibleMetadataFromChain(network, slug)] as const
      )
    );
  }

  const readsBySlug = new Map(chainReads.map(read => [read.slug, read]));

  return Promise.all(
    collectibleSlugs.map(async slug => {
      const read = readsBySlug.get(slug);

      return [slug, read ? await metadataFromChainRead(publicClient, read) : undefined] as const;
    })
  );
};

const loadEvmCollectibleMetadataFromChain = async (
  network: EvmNetworkEssentials,
  collectibleSlug: string,
  fetchMetadataFile: MetadataFileFetcher,
  signal?: AbortSignal
) => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(collectibleSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getViemPublicClient(network);

  const standard = await detectEvmTokenStandard(network, collectibleSlug);

  if (signal?.aborted) return undefined;

  try {
    switch (standard) {
      case EvmAssetStandard.ERC1155:
        return await getERC1155Metadata(publicClient, contractAddress, tokenId, fetchMetadataFile);
      case EvmAssetStandard.ERC721:
        return await getERC721Metadata(publicClient, contractAddress, tokenId, fetchMetadataFile);
      default: {
        console.error(
          `ChainId: ${network.chainId}. Slug: ${collectibleSlug}. Standard: ${standard}. Failed to load metadata. Standard is not ERC721 or ERC1155`
        );

        return undefined;
      }
    }
  } catch (error) {
    if (signal?.aborted || error instanceof IpfsBackoffError) return undefined;

    if (error instanceof IpfsTransientError) throw error;

    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${collectibleSlug}.`, error);

    return undefined;
  }
};

const getERC20Metadata = async (publicClient: ChainPublicClient, contractAddress: HexString) => {
  const [nameRes, symbolRes, decimalsRes] = await getERC20Properties(publicClient, contractAddress);

  const metadata: EvmTokenMetadata = {
    address: contractAddress,
    standard: EvmAssetStandard.ERC20,
    name: getValue(nameRes),
    symbol: getValue(symbolRes),
    decimals: getValue(decimalsRes)
  };

  return metadata;
};

const getERC721Metadata = async (
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenId: bigint,
  fetchMetadataFile: MetadataFileFetcher
) => {
  const [nameRes, symbolRes, tokenUriRes] = await getERC721Properties(publicClient, contractAddress, tokenId);

  return buildErc721Metadata(
    publicClient,
    contractAddress,
    tokenId,
    getValue(nameRes),
    getValue(symbolRes),
    getValue(tokenUriRes),
    fetchMetadataFile
  );
};

const getERC1155Metadata = async (
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenId: bigint,
  fetchMetadataFile: MetadataFileFetcher
) => {
  const [nameRes, symbolRes, tokenUriRes] = await getERC1155Properties(publicClient, contractAddress, tokenId);

  return buildErc1155Metadata(
    contractAddress,
    tokenId,
    getValue(nameRes),
    getValue(symbolRes),
    getValue(tokenUriRes),
    fetchMetadataFile
  );
};

const handleFetchedMetadata = <T>(fetchedMetadata: T[], assetSlugs: string[]) =>
  fetchedMetadata.reduce<Record<string, T | undefined>>((acc, metadata, index) => {
    const slug = assetSlugs[index];

    return { ...acc, [slug]: metadata };
  }, {});

const metadataFromChainRead = async (publicClient: ChainPublicClient, read: CollectibleChainRead) => {
  try {
    if (read.standard === EvmAssetStandard.ERC721) {
      return await buildErc721Metadata(
        publicClient,
        read.contractAddress,
        read.tokenId,
        read.name,
        read.symbol,
        read.tokenUri,
        fetchMetadataFileInteractively
      );
    }

    if (read.standard === EvmAssetStandard.ERC1155) {
      return await buildErc1155Metadata(
        read.contractAddress,
        read.tokenId,
        read.name,
        read.symbol,
        read.uri,
        fetchMetadataFileInteractively
      );
    }

    console.error(
      `ChainId: ${publicClient.chain.id}. Slug: ${read.slug}. Standard: ${read.standard}. Failed to load metadata. Standard is not ERC721 or ERC1155`
    );

    return undefined;
  } catch (error) {
    if (error instanceof IpfsBackoffError) return undefined;

    if (error instanceof IpfsTransientError) throw error;

    console.error(`ChainId: ${publicClient.chain.id}. Failed to get metadata for: ${read.slug}.`, error);

    return undefined;
  }
};

const buildErc721Metadata = async (
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenId: bigint,
  name: string | undefined,
  symbol: string | undefined,
  tokenUri: string | undefined,
  fetchMetadataFile: MetadataFileFetcher
) => {
  const metadataUri = tokenUri ?? getEnsMetadataUri(publicClient.chain.id, contractAddress, tokenId);
  if (!metadataUri) throw new Error();

  const collectibleMetadata = await getCollectiblePropertiesFromUri(metadataUri, fetchMetadataFile);

  const metadata: EvmCollectibleMetadata = {
    address: contractAddress,
    tokenId: tokenId.toString(),
    standard: EvmAssetStandard.ERC721,
    name,
    symbol,
    metadataUri,
    ...collectibleMetadata
  };

  return metadata;
};

const buildErc1155Metadata = async (
  contractAddress: HexString,
  tokenId: bigint,
  name: string | undefined,
  symbol: string | undefined,
  metadataUri: string | undefined,
  fetchMetadataFile: MetadataFileFetcher
) => {
  if (!metadataUri) throw new Error();

  const [collectibleMetadata, actualMetadataUri] = await fetchERC1155MetadataFile(
    metadataUri,
    tokenId,
    fetchMetadataFile
  );

  const metadata: EvmCollectibleMetadata = {
    address: contractAddress,
    tokenId: tokenId.toString(),
    standard: EvmAssetStandard.ERC1155,
    // ERC1155 specification does not include `symbol` or `name` view methods, see
    // https://eips.ethereum.org/EIPS/eip-1155#metadata-choices but let's assign their values if a contract has them
    name: collectibleMetadata.collectibleName ?? name,
    symbol: symbol ?? collectibleMetadata.collectibleName,
    metadataUri: actualMetadataUri,
    ...collectibleMetadata
  };

  return metadata;
};
