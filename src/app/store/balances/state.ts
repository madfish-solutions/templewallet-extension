import type { LoadableEntityState } from 'lib/store';

type PublicKeyHashWithChainId = string;

export interface BalancesStateInterface {
  balancesAtomic: Record<PublicKeyHashWithChainId, LoadableEntityState<StringRecord>>;
  triedToLoadGasBalance: Record<PublicKeyHashWithChainId, boolean>;
  triedToLoadAssetsBalances: Record<PublicKeyHashWithChainId, boolean>;
}

export const balancesInitialState: BalancesStateInterface = {
  balancesAtomic: {},
  triedToLoadGasBalance: {},
  triedToLoadAssetsBalances: {}
};
