import type { LoadableEntityState } from 'lib/store';

type PublicKeyHashWithChainId = string;

export interface BalancesStateInterface {
  balancesAtomic: Record<PublicKeyHashWithChainId, LoadableEntityState<Record<string, string>>>;
}

export const balancesInitialState: BalancesStateInterface = {
  balancesAtomic: {}
};
