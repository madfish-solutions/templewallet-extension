import { useEffect, useTransition } from 'react';

import { BigNumber } from 'bignumber.js';

import {
  DEALS_PAYOUT_ADDRESS,
  TEMPLE_BAKERY_PAYOUT_ADDRESS,
  TEMPLE_REWARDS_PAYOUT_ADDRESS
} from 'app/pages/Rewards/constants';
import { fetchTokenTransfers, TZKT_MAX_QUERY_ITEMS_LIMIT } from 'lib/apis/tzkt/api';
import { TKEY_TOKEN_METADATA, USDT_TOKEN_METADATA } from 'lib/assets/known-tokens';
import {
  DEALS_REWARDS_STATS_STORAGE_KEY,
  TEMPLE_BAKERY_REWARDS_STATS_STORAGE_KEY,
  TKEY_REWARDS_STATS_STORAGE_KEY
} from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleTezosChainId } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForTezos } from 'temple/front';

import { useRewardsAddresses } from './use-rewards-addresses';

interface RewardsTokenMeta {
  contract: string;
  tokenId: string;
  decimals: number;
}

const useRewardsStatsEntry = (
  storageKeyPrefix: string,
  senderPkh: string,
  accountAddress: string | undefined,
  tokenMeta: RewardsTokenMeta,
  errorLogPrefix: string
) => {
  // Per-address scoping prevents cross-account cache pollution: the cached
  // total/lastTransferTs only applies to the address it was fetched for.
  const scopedKey = `${storageKeyPrefix}:${accountAddress ?? 'none'}`;
  const [stats, setStats] = usePassiveStorage<null | {
    lastTransferTs?: string;
    total: string;
    lastAmount?: string;
  }>(scopedKey, null);
  const statsRef = useUpdatableRef(stats);

  const [isLoading, startLoading] = useTransition();

  useEffect(() => {
    if (!accountAddress) {
      return;
    }

    startLoading(async () => {
      try {
        const currentStats = statsRef.current;
        const newTransfers = await fetchTokenTransfers(TempleTezosChainId.Mainnet, {
          'sort.desc': 'id',
          to: accountAddress,
          from: senderPkh,
          limit: TZKT_MAX_QUERY_ITEMS_LIMIT,
          'token.contract': tokenMeta.contract,
          'token.tokenId': tokenMeta.tokenId,
          ...(currentStats?.lastTransferTs ? { 'timestamp.gt': currentStats.lastTransferTs } : {})
        });

        const newTotal = atomsToTokens(
          newTransfers.reduce((sum, tr) => sum.plus(tr.amount), ZERO),
          tokenMeta.decimals
        )
          .plus(new BigNumber(currentStats?.total ?? ZERO))
          .toFixed();
        const newLastAmount = newTransfers[0]
          ? atomsToTokens(newTransfers[0].amount, tokenMeta.decimals).toFixed()
          : currentStats?.lastAmount;
        const newLastTransferTs = newTransfers[0]?.timestamp ?? currentStats?.lastTransferTs;

        setStats({ total: newTotal, lastAmount: newLastAmount, lastTransferTs: newLastTransferTs });
      } catch (err) {
        console.error(errorLogPrefix, err);
      }
    });
  }, [
    accountAddress,
    senderPkh,
    tokenMeta.contract,
    tokenMeta.tokenId,
    tokenMeta.decimals,
    errorLogPrefix,
    setStats,
    startLoading,
    statsRef
  ]);

  return { isLoading, stats: stats ? { total: new BigNumber(stats.total), lastAmount: stats.lastAmount } : null };
};

const tkeyMeta = {
  contract: TKEY_TOKEN_METADATA.address,
  tokenId: TKEY_TOKEN_METADATA.id,
  decimals: TKEY_TOKEN_METADATA.decimals
};

const usdtMeta = {
  contract: USDT_TOKEN_METADATA.address,
  tokenId: USDT_TOKEN_METADATA.id,
  decimals: USDT_TOKEN_METADATA.decimals
};

export const useTkeyRewardsStats = () => {
  const { tezosAddress: tezosRewardsAddress } = useRewardsAddresses();

  return useRewardsStatsEntry(
    TKEY_REWARDS_STATS_STORAGE_KEY,
    TEMPLE_REWARDS_PAYOUT_ADDRESS,
    tezosRewardsAddress,
    tkeyMeta,
    'Failed to load Tkey stats: '
  );
};

export const useBakeryRewardsStats = () => {
  const tezosBakeryAddress = useAccountAddressForTezos();

  return useRewardsStatsEntry(
    TEMPLE_BAKERY_REWARDS_STATS_STORAGE_KEY,
    TEMPLE_BAKERY_PAYOUT_ADDRESS,
    tezosBakeryAddress,
    tkeyMeta,
    'Failed to load bakery stats: '
  );
};

export const useDealsRewardsStats = () => {
  const { tezosAddress: rewardsAddress } = useRewardsAddresses();

  return useRewardsStatsEntry(
    DEALS_REWARDS_STATS_STORAGE_KEY,
    DEALS_PAYOUT_ADDRESS,
    rewardsAddress,
    usdtMeta,
    'Failed to load Deals USDT stats: '
  );
};
