import { useEffect, useTransition } from 'react';

import { BigNumber } from 'bignumber.js';

import { TEMPLE_BAKERY_PAYOUT_ADDRESS, TEMPLE_REWARDS_PAYOUT_ADDRESS } from 'app/pages/Rewards/constants';
import { fetchTokenTransfers, TZKT_MAX_QUERY_ITEMS_LIMIT } from 'lib/apis/tzkt/api';
import { TKEY_TOKEN_METADATA } from 'lib/assets/known-tokens';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleTezosChainId } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForTezos } from 'temple/front';

import { useRewardsAddresses } from './use-rewards-addresses';

const useRewardsStatsEntry = (
  storageKey: string,
  senderPkh: string,
  accountAddress: string | undefined,
  errorLogPrefix: string
) => {
  const [stats, setStats] = usePassiveStorage<null | {
    lastTransferTs?: string;
    total: string;
    lastAmount?: string;
  }>(storageKey, null);
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
          'token.contract': TKEY_TOKEN_METADATA.address,
          'token.tokenId': TKEY_TOKEN_METADATA.id,
          ...(currentStats?.lastTransferTs ? { 'timestamp.gt': currentStats.lastTransferTs } : {})
        });

        const newTotal = atomsToTokens(
          newTransfers.reduce((sum, tr) => sum.plus(tr.amount), ZERO),
          TKEY_TOKEN_METADATA.decimals
        )
          .plus(new BigNumber(currentStats?.total ?? ZERO))
          .toFixed();
        const newLastAmount = newTransfers[0]
          ? atomsToTokens(newTransfers[0].amount, TKEY_TOKEN_METADATA.decimals).toFixed()
          : currentStats?.lastAmount;
        const newLastTransferTs = newTransfers[0]?.timestamp ?? currentStats?.lastTransferTs;

        await setStats({ total: newTotal, lastAmount: newLastAmount, lastTransferTs: newLastTransferTs });
      } catch (err) {
        console.error(errorLogPrefix, err);
      }
    });
  }, [accountAddress, senderPkh, errorLogPrefix, setStats, startLoading, statsRef]);

  return { isLoading, stats: stats ? { total: new BigNumber(stats.total), lastAmount: stats.lastAmount } : null };
};

const makeTkeyRewardsStatsStorageKey = (accountAddress: string | undefined) => `TKEY_REWARDS_STATS-${accountAddress}`;
const makeBakeryRewardsStatsStorageKey = (accountAddress: string | undefined) =>
  `TEMPLE_BAKERY_REWARDS_STATS-${accountAddress}`;

export const useTkeyRewardsStats = () => {
  const { tezosAddress: tezosRewardsAddress } = useRewardsAddresses();

  return useRewardsStatsEntry(
    makeTkeyRewardsStatsStorageKey(tezosRewardsAddress),
    TEMPLE_REWARDS_PAYOUT_ADDRESS,
    tezosRewardsAddress,
    'Failed to load Tkey stats: '
  );
};

export const useBakeryRewardsStats = () => {
  const tezosBakeryAddress = useAccountAddressForTezos();

  return useRewardsStatsEntry(
    makeBakeryRewardsStatsStorageKey(tezosBakeryAddress),
    TEMPLE_BAKERY_PAYOUT_ADDRESS,
    tezosBakeryAddress,
    'Failed to load bakery stats: '
  );
};
