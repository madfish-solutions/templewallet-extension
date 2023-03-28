import { LoadableEntityState } from 'lib/store/interfaces/loadable-entity-state.interface';

type PublicKeyHashWithChainId = string;

export interface BalancesStateInterface {
  balancesAtomic: Record<PublicKeyHashWithChainId, LoadableEntityState<Record<string, string>>>;
}

export const balancesInitialState: BalancesStateInterface = {
  balancesAtomic: {}
};
