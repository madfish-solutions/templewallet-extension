import { useMemo } from 'react';

import { fetchAccountBalanceHistory, type TzktBalanceHistoryItem } from 'lib/apis/tzkt';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { useTypedSWR } from 'lib/swr';
import { TempleTezosChainId } from 'lib/temple/types';
import { useTezosMainnetChain } from 'temple/front';

import { HOURS_IN_DAYS_COUNT } from '../constants';

export const useTezosAccountBalanceHistory = (accountPkh: string) => {
  const tezMainnet = useTezosMainnetChain();
  const { rawValue: tezBalanceRaw } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, tezMainnet);

  const swrResponse = useTypedSWR<TzktBalanceHistoryItem[]>(
    ['tezos-account-balance-history', accountPkh],
    () =>
      fetchAccountBalanceHistory(TempleTezosChainId.Mainnet, accountPkh, {
        limit: HOURS_IN_DAYS_COUNT,
        step: 450
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  );

  const data = useMemo(() => {
    const history = swrResponse.data;
    const latestBalance = tezBalanceRaw ? Number(tezBalanceRaw) : undefined;

    if (!history?.length || !latestBalance) {
      return history;
    }

    return [
      {
        level: history[0].level + 1, // don't need actual value here
        timestamp: new Date().toISOString(),
        balance: latestBalance
      },
      ...history
    ];
  }, [swrResponse.data, tezBalanceRaw]);

  return { ...swrResponse, data };
};
