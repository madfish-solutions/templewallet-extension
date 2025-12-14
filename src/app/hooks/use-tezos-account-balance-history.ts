import {
  fetchAccountBalanceHistory,
  TzktApiChainId,
  type TzktBalanceHistoryItem,
  type TzktGetBalanceHistoryParams
} from 'lib/apis/tzkt';
import { useTypedSWR } from 'lib/swr';

interface Params extends TzktGetBalanceHistoryParams {
  accountPkh: string;
  chainId: TzktApiChainId;
}

export const useTezosAccountBalanceHistory = ({ accountPkh, chainId, step, limit, offset }: Params) =>
  useTypedSWR<TzktBalanceHistoryItem[]>(
    ['tezos-account-balance-history', chainId, accountPkh, step, limit, offset],
    () =>
      fetchAccountBalanceHistory(chainId, accountPkh, {
        step,
        limit,
        offset
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  );
