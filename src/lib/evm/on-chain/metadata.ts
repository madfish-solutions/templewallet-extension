import { AxiosResponse } from 'axios';
import { pickBy } from 'lodash';
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  erc20Abi,
  erc721Abi,
  isHex,
  parseAbi
} from 'viem';

import { erc1155Abi } from 'lib/abi/erc1155';
import { NftCollectionAttribute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { fromAssetSlug } from 'lib/assets';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import {
  getIpfsGenericFile,
  getIpfsGenericFileInBulk,
  IpfsBackoffError,
  IpfsHostPausedError,
  IpfsTransientError
} from 'lib/utils/ipfs';
import { ChainPublicClient, getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmAssetStandard } from '../types';

import { detectEvmTokenStandard } from './utils/common.utils';

export const fetchEvmTokensMetadataFromChain = async (network: EvmNetworkEssentials, tokenSlugs: string[]) =>
  Promise.all(tokenSlugs.map(slug => fetchEvmTokenMetadataFromChain(network, slug))).then(fetchedMetadata =>
    handleFetchedMetadata<EvmTokenMetadata | undefined>(fetchedMetadata, tokenSlugs)
  );

export const fetchEvmCollectiblesMetadataFromChain = async (
  network: EvmNetworkEssentials,
  collectibleSlugs: string[]
) =>
  Promise.all(collectibleSlugs.map(slug => fetchEvmCollectibleMetadataFromChain(network, slug))).then(fetchedMetadata =>
    handleFetchedMetadata<EvmCollectibleMetadata | undefined>(fetchedMetadata, collectibleSlugs)
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
) =>
  loadEvmCollectibleMetadataFromChain(
    network,
    collectibleSlug,
    uri => getIpfsGenericFileInBulk<CollectibleMetadata>(uri, signal),
    signal
  );

const loadEvmCollectibleMetadataFromChain = async (
  network: EvmNetworkEssentials,
  collectibleSlug: string,
  fetchMetadataFile: MetadataFileFetcher,
  signal?: AbortSignal
) => {
  if (signal?.aborted) return undefined;

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

    if (signal && (error instanceof IpfsHostPausedError || error instanceof IpfsTransientError)) throw error;

    console.error(`ChainId: ${network.chainId}. Failed to get metadata for: ${collectibleSlug}.`, error);

    return undefined;
  }
};

const getERC20Metadata = async (publicClient: ChainPublicClient, contractAddress: HexString) => {
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

const getERC721Metadata = async (
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenId: bigint,
  fetchMetadataFile: MetadataFileFetcher
) => {
  const results = await getERC721Properties(publicClient, contractAddress, tokenId);

  const metadataUri = getValue<string>(results[2]);

  if (!metadataUri) throw new Error();

  const collectibleMetadata = await getCollectiblePropertiesFromUri(metadataUri, fetchMetadataFile);

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

const getERC1155Metadata = async (
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenId: bigint,
  fetchMetadataFile: MetadataFileFetcher
) => {
  const results = await getERC1155Properties(publicClient, contractAddress, tokenId);

  const metadataUri = getValue<string>(results[2]);

  if (!metadataUri) throw new Error();

  const tokenIdStr = tokenId.toString();

  let collectibleMetadata, actualMetadataUri;
  try {
    actualMetadataUri = metadataUri.replace('{id}', tokenIdStr.padStart(64, '0'));
    collectibleMetadata = await getCollectiblePropertiesFromUri(actualMetadataUri, fetchMetadataFile);
  } catch {
    actualMetadataUri = metadataUri.replace('{id}', tokenIdStr);
    collectibleMetadata = await getCollectiblePropertiesFromUri(actualMetadataUri, fetchMetadataFile);
  }

  const metadata: EvmCollectibleMetadata = {
    address: contractAddress,
    tokenId: tokenIdStr,
    standard: EvmAssetStandard.ERC1155,
    // ERC1155 specification does not include `symbol` or `name` view methods, see
    // https://eips.ethereum.org/EIPS/eip-1155#metadata-choices but let's assign their values if a contract has them
    name: collectibleMetadata.collectibleName ?? getValue<string>(results[0]),
    symbol: getValue<string>(results[1]) ?? collectibleMetadata.collectibleName,
    metadataUri: actualMetadataUri,
    ...collectibleMetadata
  };

  return metadata;
};

const commonPropertiesByContract = new Map<
  string,
  Promise<[PromiseSettledResult<string>, PromiseSettledResult<string>]>
>();

const isContractLevelFailure = (reason: unknown) =>
  reason instanceof ContractFunctionExecutionError &&
  reason.walk(
    error =>
      error instanceof ContractFunctionZeroDataError ||
      (error instanceof ContractFunctionRevertedError && isHex(error.raw))
  ) !== null;

const getCommonProperties = (
  publicClient: ChainPublicClient,
  contractAddress: HexString
): Promise<[PromiseSettledResult<string>, PromiseSettledResult<string>]> => {
  const key = `${publicClient.chain.id}:${contractAddress}`;
  const memoised = commonPropertiesByContract.get(key);

  if (memoised) return memoised;

  const properties = Promise.allSettled([
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
  ]);
  commonPropertiesByContract.set(key, properties);
  void properties.then(results => {
    if (results.some(result => result.status === 'rejected' && !isContractLevelFailure(result.reason)))
      commonPropertiesByContract.delete(key);
  });

  return properties;
};

const withCommonProperties = async <T>(
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenProperty: Promise<T>
): Promise<[PromiseSettledResult<string>, PromiseSettledResult<string>, PromiseSettledResult<T>]> => {
  const [[name, symbol], [property]] = await Promise.all([
    getCommonProperties(publicClient, contractAddress),
    Promise.allSettled([tokenProperty])
  ]);

  return [name, symbol, property];
};

const getERC20Properties = (publicClient: ChainPublicClient, contractAddress: HexString) =>
  withCommonProperties(
    publicClient,
    contractAddress,
    publicClient.readContract({
      address: contractAddress,
      abi: erc20Abi,
      functionName: 'decimals'
    })
  );

const getERC721Properties = (publicClient: ChainPublicClient, contractAddress: HexString, tokenId: bigint) =>
  withCommonProperties(
    publicClient,
    contractAddress,
    publicClient.readContract({
      address: contractAddress,
      abi: erc721Abi,
      functionName: 'tokenURI',
      args: [tokenId]
    })
  );

const getERC1155Properties = (publicClient: ChainPublicClient, contractAddress: HexString, tokenId: bigint) =>
  withCommonProperties(
    publicClient,
    contractAddress,
    publicClient.readContract({
      address: contractAddress,
      abi: erc1155Abi,
      functionName: 'uri',
      args: [tokenId]
    })
  );

const handleFetchedMetadata = <T>(fetchedMetadata: T[], assetSlugs: string[]) =>
  fetchedMetadata.reduce<Record<string, T | undefined>>((acc, metadata, index) => {
    const slug = assetSlugs[index];

    return { ...acc, [slug]: metadata };
  }, {});

const getValue = <T>(result: PromiseSettledResult<T>) => (result.status === 'fulfilled' ? result.value : undefined);

interface CollectibleMetadata {
  image?: string;
  name?: string;
  decimals?: number;
  description?: string;
  attributes?: NftCollectionAttribute[];
  external_url?: string;
  animation_url?: string;
}

interface MetadataFileResponse {
  data: CollectibleMetadata;
  headers?: AxiosResponse['headers'];
}

type MetadataFileFetcher = (uri: string) => Promise<MetadataFileResponse>;

const fetchMetadataFileInteractively: MetadataFileFetcher = uri => getIpfsGenericFile<CollectibleMetadata>(uri);

const getCollectiblePropertiesFromUri = async (
  metadataUri: string | undefined,
  fetchMetadataFile: MetadataFileFetcher
): Promise<
  Pick<
    EvmCollectibleMetadata,
    'image' | 'collectibleName' | 'description' | 'attributes' | 'externalUrl' | 'animationUrl'
  >
> => {
  if (!metadataUri) throw new Error();

  const { data, headers } = await fetchMetadataFile(metadataUri);

  if (String(headers?.['content-type'] ?? '').startsWith('image/')) return { image: metadataUri };

  if (typeof data !== 'object' || !data.image) throw new Error();

  const {
    name,
    description,
    decimals,
    image,
    attributes,
    external_url: externalUrl,
    animation_url: animationUrl
  } = data;

  return {
    image,
    collectibleName: name,
    description,
    ...pickBy({ attributes, externalUrl, animationUrl, decimals }, value => value !== undefined && value !== '')
  };
};
