import {
  fetchAccountBalanceHistory,
  type TzktBalanceHistoryItem,
  type TzktGetBalanceHistoryParams
} from 'lib/apis/tzkt';
import { useTypedSWR } from 'lib/swr';
import { TempleTezosChainId } from 'lib/temple/types';

export const useTezosAccountBalanceHistory = (accountPkh: string, params?: TzktGetBalanceHistoryParams) =>
  useTypedSWR<TzktBalanceHistoryItem[]>(
    ['tezos-account-balance-history', accountPkh, params],
    () => fetchAccountBalanceHistory(TempleTezosChainId.Mainnet, accountPkh, params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  );
