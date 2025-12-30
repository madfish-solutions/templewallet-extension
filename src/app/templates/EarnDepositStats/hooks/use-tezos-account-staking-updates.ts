import { fetchStakingUpdates, type TzktApiChainId, type TzktStakingUpdate } from 'lib/apis/tzkt';
import { type TzktGetStakingUpdatesParams } from 'lib/apis/tzkt/api';
import { useTypedSWR } from 'lib/swr';

export const useTezosAccountStakingUpdates = (
  accountPkh: string,
  chainId: TzktApiChainId,
  params?: TzktGetStakingUpdatesParams
) =>
  useTypedSWR<TzktStakingUpdate[]>(
    ['get-staking-updates-tzkt', chainId, accountPkh],
    () => fetchStakingUpdates(chainId, { staker: accountPkh, ...params }),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
