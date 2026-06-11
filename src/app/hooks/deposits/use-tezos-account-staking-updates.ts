import { fetchStakingUpdates, type TzktStakingUpdate } from 'lib/apis/tzkt';
import { useTypedSWR } from 'lib/swr';
import { TempleTezosChainId } from 'lib/temple/types';

export const useTezosAccountStakingUpdates = (accountPkh: string) =>
  useTypedSWR<TzktStakingUpdate[]>(
    ['get-staking-updates-tzkt', accountPkh],
    () => fetchStakingUpdates(TempleTezosChainId.Mainnet, { staker: accountPkh, limit: 500 }),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
