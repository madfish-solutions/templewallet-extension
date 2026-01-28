import { fetchStakingUpdates, type TzktStakingUpdate } from 'lib/apis/tzkt';
import { type TzktGetStakingUpdatesParams } from 'lib/apis/tzkt/api';
import { useTypedSWR } from 'lib/swr';
import { TempleTezosChainId } from 'lib/temple/types';

export const useTezosAccountStakingUpdates = (accountPkh: string, params?: TzktGetStakingUpdatesParams) =>
  useTypedSWR<TzktStakingUpdate[]>(
    ['get-staking-updates-tzkt', accountPkh],
    () => fetchStakingUpdates(TempleTezosChainId.Mainnet, { staker: accountPkh, ...params }),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
