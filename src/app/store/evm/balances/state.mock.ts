import { mockPersistedState } from 'lib/store';

import { EvmBalancesStateInterface } from './state';

export const mockEvmBalancesState = mockPersistedState<EvmBalancesStateInterface>({
  balancesAtomic: {},
  dataTimestamps: {},
  initiallyLoadedChains: {}
});
