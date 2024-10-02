import { getEvmERC20Transfers, getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetMetadataGetter } from 'lib/metadata';

import { EvmActivity } from '../types';

import { parseGoldRushTransaction, parseGoldRushERC20Transfer } from './parse';

export async function getEvmAssetTransactions(
  walletAddress: string,
  chainId: number,
  getMetadata: EvmAssetMetadataGetter,
  assetSlug?: string,
  page?: number,
  signal?: AbortSignal
) {
  if (!assetSlug || assetSlug === EVM_TOKEN_SLUG) {
    const { items, nextPage } = await getEvmTransactions(walletAddress, chainId, page, signal);

    signal?.throwIfAborted();

    return {
      activities: items.map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress, getMetadata)),
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
    activities: items.map<EvmActivity>(item => parseGoldRushERC20Transfer(item, chainId, walletAddress, getMetadata)),
    nextPage
  };
}
