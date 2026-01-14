import {
  fetchAccountBalanceHistory,
  TzktApiChainId,
  type TzktBalanceHistoryItem,
  type TzktGetBalanceHistoryParams
} from 'lib/apis/tzkt';
import { useTypedSWR } from 'lib/swr';

export const useTezosAccountBalanceHistory = (
  accountPkh: string,
  chainId: TzktApiChainId,
  params?: TzktGetBalanceHistoryParams
) =>
  useTypedSWR<TzktBalanceHistoryItem[]>(
    ['tezos-account-balance-history', chainId, accountPkh, params],
    () => fetchAccountBalanceHistory(chainId, accountPkh, params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  );
