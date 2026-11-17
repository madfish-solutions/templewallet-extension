import { parseAbi } from 'viem';

import { fromAssetSlug } from 'lib/assets';
import { ChainPublicClient } from 'temple/evm';

import { ContractInterfaceId, EvmAssetStandard } from '../types';

const collectibleMetadataAbi = parseAbi([
  'function supportsInterface(bytes4 interfaceID) view returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function uri(uint256 id) view returns (string)'
]);

interface ParsedCollectibleSlug {
  slug: string;
  contractAddress: HexString;
  tokenId: bigint;
}

export interface CollectibleChainRead {
  slug: string;
  contractAddress: HexString;
  tokenId: bigint;
  standard?: EvmAssetStandard.ERC721 | EvmAssetStandard.ERC1155;
  name?: string;
  symbol?: string;
  tokenUri?: string;
  uri?: string;
}

interface MetadataCall {
  address: HexString;
  abi: typeof collectibleMetadataAbi;
  functionName: 'supportsInterface' | 'name' | 'symbol' | 'tokenURI' | 'uri';
  args?: readonly unknown[];
}

type MetadataCallLabel =
  | { kind: 'erc721'; contractKey: string }
  | { kind: 'erc1155'; contractKey: string }
  | { kind: 'name'; contractKey: string }
  | { kind: 'symbol'; contractKey: string }
  | { kind: 'tokenURI'; index: number }
  | { kind: 'uri'; index: number };

interface SettledMetadataCall {
  status: string;
  result?: unknown;
}

const parseCollectibleSlug = (slug: string): ParsedCollectibleSlug | undefined => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(slug);
  if (!contractAddress) return undefined;

  try {
    return { slug, contractAddress, tokenId: BigInt(tokenIdStr ?? 0) };
  } catch {
    return undefined;
  }
};

const contractKeyOf = (address: string) => address.toLowerCase();

const succeededString = (response: SettledMetadataCall | undefined) =>
  response?.status === 'success' && typeof response.result === 'string' ? response.result : undefined;

const supportsInterface = (response: SettledMetadataCall | undefined) =>
  response?.status === 'success' && response.result === true;

/** One multicall reads the standard, name, symbol, and metadata URI for every slug. */
export const readCollectibleChainFields = async (
  publicClient: ChainPublicClient,
  slugs: readonly string[]
): Promise<CollectibleChainRead[]> => {
  const parsed = slugs.flatMap(slug => {
    const item = parseCollectibleSlug(slug);

    return item ? [item] : [];
  });
  if (!parsed.length) return [];

  const calls: MetadataCall[] = [];
  const labels: MetadataCallLabel[] = [];
  const seenContracts = new Set<string>();

  for (const item of parsed) {
    const contractKey = contractKeyOf(item.contractAddress);
    if (seenContracts.has(contractKey)) continue;
    seenContracts.add(contractKey);

    calls.push(
      {
        address: item.contractAddress,
        abi: collectibleMetadataAbi,
        functionName: 'supportsInterface',
        args: [ContractInterfaceId.ERC721]
      },
      {
        address: item.contractAddress,
        abi: collectibleMetadataAbi,
        functionName: 'supportsInterface',
        args: [ContractInterfaceId.ERC1155]
      },
      { address: item.contractAddress, abi: collectibleMetadataAbi, functionName: 'name' },
      { address: item.contractAddress, abi: collectibleMetadataAbi, functionName: 'symbol' }
    );
    labels.push(
      { kind: 'erc721', contractKey },
      { kind: 'erc1155', contractKey },
      { kind: 'name', contractKey },
      { kind: 'symbol', contractKey }
    );
  }

  parsed.forEach((item, index) => {
    calls.push(
      {
        address: item.contractAddress,
        abi: collectibleMetadataAbi,
        functionName: 'tokenURI',
        args: [item.tokenId]
      },
      {
        address: item.contractAddress,
        abi: collectibleMetadataAbi,
        functionName: 'uri',
        args: [item.tokenId]
      }
    );
    labels.push({ kind: 'tokenURI', index }, { kind: 'uri', index });
  });

  const responses = await publicClient.multicall({ allowFailure: true, contracts: calls });
  const contracts = new Map<string, { erc721: boolean; erc1155: boolean; name?: string; symbol?: string }>();
  const tokenUris: Array<string | undefined> = [];
  const uris: Array<string | undefined> = [];

  labels.forEach((label, index) => {
    const response = responses[index];

    if (label.kind === 'erc721' || label.kind === 'erc1155' || label.kind === 'name' || label.kind === 'symbol') {
      const current = contracts.get(label.contractKey) ?? { erc721: false, erc1155: false };
      if (label.kind === 'erc721') current.erc721 = supportsInterface(response);
      else if (label.kind === 'erc1155') current.erc1155 = supportsInterface(response);
      else if (label.kind === 'name') current.name = succeededString(response);
      else current.symbol = succeededString(response);
      contracts.set(label.contractKey, current);

      return;
    }

    const uri = succeededString(response);
    if (label.kind === 'tokenURI') tokenUris[label.index] = uri;
    else uris[label.index] = uri;
  });

  return parsed.map((item, index) => {
    const contract = contracts.get(contractKeyOf(item.contractAddress));
    const standard = contract?.erc721
      ? EvmAssetStandard.ERC721
      : contract?.erc1155
        ? EvmAssetStandard.ERC1155
        : undefined;

    return {
      slug: item.slug,
      contractAddress: item.contractAddress,
      tokenId: item.tokenId,
      standard,
      name: contract?.name,
      symbol: contract?.symbol,
      tokenUri: tokenUris[index],
      uri: uris[index]
    };
  });
};
