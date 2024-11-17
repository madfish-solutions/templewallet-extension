// TODO: Make requests via axios, not SDK
import {
  Alchemy,
  AssetTransfersCategory,
  Network,
  AssetTransfersWithMetadataParams,
  SortingOrder,
  AssetTransfersWithMetadataResult
} from 'alchemy-sdk';
import { groupBy, uniqBy } from 'lodash';

import { getEvmERC20Transfers, getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { TempleChainKind } from 'temple/types';

import { ActivityStatus, EvmActivity } from '../types';

import { parseGoldRushTransaction, parseGoldRushERC20Transfer } from './parse';
import { parseTransfer } from './parse/alchemy';

export async function getEvmAssetTransactions(
  walletAddress: string,
  chainId: number,
  assetSlug?: string,
  page?: number,
  signal?: AbortSignal
) {
  if (!assetSlug || assetSlug === EVM_TOKEN_SLUG) {
    const { items, nextPage } = await getEvmTransactions(walletAddress, chainId, page, signal);

    signal?.throwIfAborted();

    return {
      activities: items.map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress)),
      nextPage
    };
  }

  const [contract] = fromAssetSlug(assetSlug);

  /* Way to do the rest here through GoldRush API v3
  let nextPage: number | nullish = page;

  while (nextPage !== null) {
    const data = await getEvmTransactions(walletAddress, chainId, nextPage);

    const activities = data.items
      .map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress, getMetadata))
      .filter(a =>
        a.operations.some(
          ({ asset }) => asset && asset.contract === contract && (asset.tokenId == null || asset.tokenId === tokenId)
        )
      );

    if (activities.length) return { activities, nextPage: data.nextPage };

    nextPage = data.nextPage;
  }

  return { nextPage: null, activities: [] };
  */

  const { items, nextPage } = await getEvmERC20Transfers(walletAddress, chainId, contract, page, signal);

  signal?.throwIfAborted();

  return {
    activities: items.map<EvmActivity>(item => parseGoldRushERC20Transfer(item, chainId, walletAddress)),
    nextPage
  };
}

export async function getEvmActivities(
  chainId: number,
  accAddress: string,
  olderThanBlockHeight?: string,
  signal?: AbortSignal
) {
  const accAddressLowercased = accAddress.toLowerCase();

  const allTransfers = await fetchTransfers(chainId, accAddress, olderThanBlockHeight, signal);
  if (!allTransfers.length) return [];

  const groups = Object.entries(groupBy(allTransfers, 'hash'));

  const activities: EvmActivity[] = [];

  for (const [hash, transfers] of groups) {
    const firstTransfer = transfers.at(0)!;

    const operations = transfers.map(transfer => parseTransfer(transfer, accAddressLowercased));

    const activity: EvmActivity = {
      chain: TempleChainKind.EVM,
      chainId,
      hash,
      status: ActivityStatus.applied,
      addedAt: firstTransfer.metadata.blockTimestamp,
      operations,
      operationsCount: operations.length,
      blockHeight: `${Number(firstTransfer.blockNum)}`
    };

    activities.push(activity);
  }

  return activities;
}

async function fetchTransfers(
  chainId: number,
  accAddress: string,
  olderThanBlockHeight?: string,
  signal?: AbortSignal
): Promise<AssetTransfersWithMetadataResult[]> {
  const chainName = CHAINS_NAMES[chainId];
  if (!chainName) return [];

  const alchemy = new Alchemy({
    apiKey: process.env._ALCHEMY_API_KEY, // TODO: To EnvVars
    network: chainName
  });

  const [transfersFrom, transfersTo] = await Promise.all([
    _fetchTransfers(alchemy, accAddress, false, olderThanBlockHeight),
    _fetchTransfers(alchemy, accAddress, true, olderThanBlockHeight)
  ]);

  const allTransfers = transfersFrom
    .concat(transfersTo)
    .toSorted((a, b) => (a.metadata.blockTimestamp > b.metadata.blockTimestamp ? -1 : 1));

  if (!allTransfers.length) return [];

  const sameTrailingHashes = calcSameTrailingHashes(allTransfers);

  /** Will need to filter those transfers, that r made from & to the same address */
  const uniqByKey: keyof (typeof allTransfers)[number] = 'uniqueId';

  if (sameTrailingHashes === allTransfers.length) {
    // const moreTransfers = []; // TODO: Fetch more transfers until reach another hash ?
    // return uniqBy(allTransfers.concat(moreTransfers), uniqByKey);
  }

  allTransfers.splice(allTransfers.length - sameTrailingHashes, sameTrailingHashes);

  return uniqBy(allTransfers, uniqByKey);
}

async function _fetchTransfers(alchemy: Alchemy, accAddress: string, toAcc = false, olderThanBlockHeight?: string) {
  const toBlock = olderThanBlockHeight ? '0x' + (BigInt(olderThanBlockHeight) - BigInt(1)).toString(16) : undefined;

  const categories = new Set(Object.values(AssetTransfersCategory));
  const excludedCategory = EXCLUDED_CATEGORIES[alchemy.config.network];
  if (excludedCategory) categories.delete(excludedCategory);

  const reqOptions: AssetTransfersWithMetadataParams = {
    order: SortingOrder.DESCENDING,
    category: Array.from(categories),
    excludeZeroValue: true,
    withMetadata: true,
    toBlock,
    maxCount: 50
  };

  if (toAcc) reqOptions.toAddress = accAddress;
  else reqOptions.fromAddress = accAddress;

  // TODO: Seems like Alchemy SDK processes Error 429 itself
  return alchemy.core.getAssetTransfers(reqOptions).then(r => r.transfers);
}

function calcSameTrailingHashes(transfers: AssetTransfersWithMetadataResult[]) {
  const trailingHash = transfers.at(transfers.length - 1)!.hash;
  if (transfers.at(0)!.hash === trailingHash) return transfers.length; // All are same, saving runtime

  if (transfers.length === 2) return 1; // Preposition for further math

  const sameTrailingHashes = transfers.length - 1 - transfers.findLastIndex(tr => tr.hash !== trailingHash);

  return sameTrailingHashes;
}

/** E.g. 'opt_mainnet' does not support 'internal' category */
const EXCLUDED_CATEGORIES: Partial<Record<Network, AssetTransfersCategory>> = {
  [Network.OPT_MAINNET]: AssetTransfersCategory.INTERNAL,
  [Network.OPT_SEPOLIA]: AssetTransfersCategory.INTERNAL,
  [Network.MATIC_AMOY]: AssetTransfersCategory.INTERNAL
};

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
