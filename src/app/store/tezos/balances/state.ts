import type { LoadableEntityState } from 'lib/store';

type PublicKeyHashWithChainId = string;

export interface BalancesStateInterface {
  balancesAtomic: Record<PublicKeyHashWithChainId, LoadableEntityState<StringRecord>>;
}

export const balancesInitialState: BalancesStateInterface = {
  balancesAtomic: {}
};
