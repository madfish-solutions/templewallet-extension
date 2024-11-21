import {
  Alchemy,
  AssetTransfersCategory,
  Network,
  AssetTransfersWithMetadataParams,
  SortingOrder,
  AssetTransfersWithMetadataResult
} from 'alchemy-sdk';
import { groupBy, uniqBy } from 'lodash';

import { fromAssetSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { TempleChainKind } from 'temple/types';

import { EvmActivity } from '../types';

import { parseApprovalLog, parseTransfer } from './parse';

const TR_PSEUDO_LIMIT = 50;

export async function getEvmActivities(
  chainId: number,
  accAddress: string,
  assetSlug?: string,
  olderThanBlockHeight?: `${number}`,
  signal?: AbortSignal
) {
  const chainName = CHAINS_NAMES[chainId];
  if (!chainName) return [];

  const accAddressLowercased = accAddress.toLowerCase();

  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  const allTransfers = await fetchTransfers(chainName, accAddress, contractAddress, olderThanBlockHeight, signal);
  if (!allTransfers.length) return [];

  const allApprovals =
    contractAddress === EVM_TOKEN_SLUG
      ? []
      : await fetchApprovals(
          chainName,
          accAddress,
          contractAddress,
          olderThanBlockHeight,
          // Loading approvals withing the gap of received transfers.
          // TODO: Mind the case of reaching response items number limit & not reaching block heights gap.
          allTransfers.at(-1)?.blockNum
        );

  const groups = Object.entries(groupBy(allTransfers, 'hash'));

  return groups.map<EvmActivity>(([hash, transfers]) => {
    const firstTransfer = transfers.at(0)!;

    const approvals = allApprovals.filter(a => a.transactionHash === hash).map(approval => parseApprovalLog(approval));

    const operations = transfers.map(transfer => parseTransfer(transfer, accAddressLowercased)).concat(approvals);

    return {
      chain: TempleChainKind.EVM,
      chainId,
      hash,
      // status: Not provided by the API. Those which `failed`, are included still.
      addedAt: firstTransfer.metadata.blockTimestamp,
      operations,
      operationsCount: operations.length,
      blockHeight: `${Number(firstTransfer.blockNum)}`
    };
  });
}

async function fetchTransfers(
  chainName: Network,
  accAddress: string,
  contractAddress?: string,
  olderThanBlockHeight?: `${number}`,
  signal?: AbortSignal
): Promise<AssetTransfersWithMetadataResult[]> {
  const alchemy = new Alchemy({
    apiKey: process.env._ALCHEMY_API_KEY, // TODO: To EnvVars
    network: chainName
  });

  const [transfersFrom, transfersTo] = await Promise.all([
    _fetchTransfers(alchemy, accAddress, contractAddress, false, olderThanBlockHeight),
    _fetchTransfers(alchemy, accAddress, contractAddress, true, olderThanBlockHeight)
  ]);

  const allTransfers = mergeFetchedTransfers(transfersFrom, transfersTo);

  if (!allTransfers.length) return [];

  allTransfers.sort(sortPredicate);

  /** Will need to filter those transfers, that r made from & to the same address */
  const uniqByKey: keyof (typeof allTransfers)[number] = 'uniqueId';

  return uniqBy(cutOffTrailingSameHashes(allTransfers), uniqByKey);
}

/** Order of the lists (which goest 1st) is not important here */
function mergeFetchedTransfers(
  transfersFrom: AssetTransfersWithMetadataResult[],
  transfersTo: AssetTransfersWithMetadataResult[]
) {
  // 1. One of them is empty
  if (!transfersFrom.length) return transfersTo;
  if (!transfersTo.length) return transfersFrom;

  // 2. Both haven't reached the limit - basically reached the end for both
  if (transfersFrom.length < TR_PSEUDO_LIMIT && transfersTo.length < TR_PSEUDO_LIMIT)
    return transfersFrom.concat(transfersTo);

  // 3. Second hasn't reached the limit; first reached the end
  if (transfersTo.length < TR_PSEUDO_LIMIT) {
    // transfersFrom.length === TR_PSEUDO_LIMIT here
    const edgeBlockNum = transfersTo.at(-1)!.blockNum;

    return transfersFrom.filter(t => t.blockNum >= edgeBlockNum).concat(transfersTo);
  }

  // 4. First hasn't reached the limit; second reached the end
  if (transfersFrom.length < TR_PSEUDO_LIMIT) {
    // transfersTo.length === TR_PSEUDO_LIMIT here
    const edgeBlockNum = transfersFrom.at(-1)!.blockNum;

    return transfersTo.filter(t => t.blockNum >= edgeBlockNum).concat(transfersFrom);
  }

  // 5. Both reached the limit

  const trFromLastBlockNum = transfersFrom.at(-1)!.blockNum;

  if (trFromLastBlockNum > transfersTo.at(0)!.blockNum) return transfersFrom;

  const trToLastBlockNum = transfersTo.at(-1)!.blockNum;

  if (trToLastBlockNum > transfersFrom.at(0)!.blockNum) return transfersTo;

  if (trFromLastBlockNum > trToLastBlockNum) {
    transfersTo = transfersTo.filter(tr => tr.blockNum >= trFromLastBlockNum);
  } else {
    transfersFrom = transfersFrom.filter(tr => tr.blockNum >= trToLastBlockNum);
  }

  return transfersFrom.concat(transfersTo);
}

function cutOffTrailingSameHashes(transfers: AssetTransfersWithMetadataResult[]) {
  const sameTrailingHashes = calcSameTrailingHashes(transfers);

  if (sameTrailingHashes === transfers.length)
    // (!) Leaving the list as is - this puts a limit on max batch size we display
    return transfers;

  return transfers.slice(0, -sameTrailingHashes);
}

async function _fetchTransfers(
  alchemy: Alchemy,
  accAddress: string,
  contractAddress?: string,
  toAcc = false,
  olderThanBlockHeight?: `${number}`
) {
  const categories = new Set(
    contractAddress === EVM_TOKEN_SLUG
      ? GAS_CATEGORIES
      : contractAddress
      ? ASSET_CATEGORIES // (!) TODO: Won't have gas transfer operations in batches this way
      : Object.values(AssetTransfersCategory)
  );

  if (EXCLUDED_INTERNAL_CATEGORY.has(alchemy.config.network)) categories.delete(AssetTransfersCategory.INTERNAL);

  if (contractAddress === EVM_TOKEN_SLUG) contractAddress = undefined;

  const reqOptions: AssetTransfersWithMetadataParams = {
    contractAddresses: contractAddress ? [contractAddress] : undefined,
    order: SortingOrder.DESCENDING,
    category: Array.from(categories),
    excludeZeroValue: true,
    withMetadata: true,
    toBlock: olderThanBlockToToBlockValue(olderThanBlockHeight),
    maxCount: TR_PSEUDO_LIMIT
  };

  if (toAcc) reqOptions.toAddress = accAddress;
  else reqOptions.fromAddress = accAddress;

  // TODO: Seems like Alchemy SDK processes Error 429 itself
  return alchemy.core.getAssetTransfers(reqOptions).then(r => r.transfers);
}

function calcSameTrailingHashes(transfers: AssetTransfersWithMetadataResult[]) {
  if (!transfers.length) return 0;

  const trailingHash = transfers.at(-1)!.hash;
  if (transfers.at(0)!.hash === trailingHash) return transfers.length; // All are same, saving runtime

  if (transfers.length === 2) return 1; // Preposition for further math

  const sameTrailingHashes = transfers.length - 1 - transfers.findLastIndex(tr => tr.hash !== trailingHash);

  return sameTrailingHashes;
}

function sortPredicate(
  { metadata: { blockTimestamp: aTs } }: AssetTransfersWithMetadataResult,
  { metadata: { blockTimestamp: bTs } }: AssetTransfersWithMetadataResult
) {
  if (aTs < bTs) return 1;
  if (aTs > bTs) return -1;
  // return aTs < bTs ? 1 : -1;
  return 0;
}

function fetchApprovals(
  chainName: Network,
  accAddress: string,
  contractAddress?: string,
  olderThanBlockHeight?: `${number}`,
  /** Hex string. Including said block. */
  fromBlock?: string
) {
  const alchemy = new Alchemy({
    apiKey: process.env._ALCHEMY_API_KEY, // TODO: To EnvVars
    network: chainName
  });

  return alchemy.core.getLogs({
    address: contractAddress,
    topics: [
      [
        '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', // Approval
        '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31' // ApprovalForAll
      ],
      `0x000000000000000000000000${accAddress.slice(2)}`
    ],
    toBlock: olderThanBlockToToBlockValue(olderThanBlockHeight),
    fromBlock
  });
}

function olderThanBlockToToBlockValue(olderThanBlockHeight: `${number}` | undefined) {
  return olderThanBlockHeight ? '0x' + (BigInt(olderThanBlockHeight) - BigInt(1)).toString(16) : undefined;
}

const GAS_CATEGORIES = [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.INTERNAL];
const ASSET_CATEGORIES = [
  AssetTransfersCategory.ERC20,
  AssetTransfersCategory.ERC721,
  AssetTransfersCategory.ERC1155,
  AssetTransfersCategory.SPECIALNFT
];

/** If included, response fails with message about category not being supported. */
const EXCLUDED_INTERNAL_CATEGORY = new Set([Network.OPT_MAINNET, Network.OPT_SEPOLIA, Network.MATIC_AMOY]);

/** TODO: Verify this mapping */
const CHAINS_NAMES: Record<number, Network> = {
  1: Network.ETH_MAINNET,
  5: Network.ETH_GOERLI,
  10: Network.OPT_MAINNET,
  30: Network.ROOTSTOCK_MAINNET,
  31: Network.ROOTSTOCK_TESTNET,
  56: Network.BNB_MAINNET,
  97: Network.BNB_TESTNET,
  100: Network.GNOSIS_MAINNET,
  137: Network.MATIC_MAINNET,
  204: Network.OPBNB_MAINNET,
  250: Network.FANTOM_MAINNET,
  300: Network.ZKSYNC_SEPOLIA,
  324: Network.ZKSYNC_MAINNET,
  360: Network.SHAPE_MAINNET,
  420: Network.OPT_GOERLI,
  480: Network.WORLDCHAIN_MAINNET,
  592: Network.ASTAR_MAINNET,
  1088: Network.METIS_MAINNET,
  1101: Network.POLYGONZKEVM_MAINNET,
  1442: Network.POLYGONZKEVM_TESTNET,
  1946: Network.SONEIUM_MINATO,
  2442: Network.POLYGONZKEVM_CARDONA,
  4002: Network.FANTOM_TESTNET,
  4801: Network.WORLDCHAIN_SEPOLIA,
  5000: Network.MANTLE_MAINNET,
  5003: Network.MANTLE_SEPOLIA,
  5611: Network.OPBNB_TESTNET,
  7000: Network.ZETACHAIN_MAINNET,
  7001: Network.ZETACHAIN_TESTNET,
  8453: Network.BASE_MAINNET,
  10200: Network.GNOSIS_CHIADO,
  11011: Network.SHAPE_SEPOLIA,
  42161: Network.ARB_MAINNET,
  42220: Network.CELO_MAINNET,
  43113: Network.AVAX_FUJI,
  43114: Network.AVAX_MAINNET,
  42170: Network.ARBNOVA_MAINNET,
  44787: Network.CELO_ALFAJORES,
  59141: Network.LINEA_SEPOLIA,
  59144: Network.LINEA_MAINNET,
  80001: Network.MATIC_MUMBAI,
  80002: Network.MATIC_AMOY,
  80084: Network.BERACHAIN_BARTIO,
  81457: Network.BLAST_MAINNET,
  84531: Network.BASE_GOERLI,
  84532: Network.BASE_SEPOLIA,
  421613: Network.ARB_GOERLI,
  421614: Network.ARB_SEPOLIA,
  534351: Network.SCROLL_SEPOLIA,
  534352: Network.SCROLL_MAINNET,
  11155111: Network.ETH_SEPOLIA,
  11155420: Network.OPT_SEPOLIA,
  168587773: Network.BLAST_SEPOLIA
};
