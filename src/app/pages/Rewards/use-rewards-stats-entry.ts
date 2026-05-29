import { useEffect, useMemo, useTransition } from 'react';

import { BigNumber } from 'bignumber.js';

import { fetchTokenTransfers, TZKT_MAX_QUERY_ITEMS_LIMIT } from 'lib/apis/tzkt/api';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleTezosChainId } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';

interface RewardsTokenMeta {
  contract: string;
  tokenId: string;
  decimals: number;
}

export const useRewardsStatsEntry = (
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

  const parsedStats = useMemo(
    () => (stats ? { total: new BigNumber(stats.total), lastAmount: stats.lastAmount } : null),
    [stats]
  );

  return { isLoading, stats: parsedStats };
};
