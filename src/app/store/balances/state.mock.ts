import { createEntity } from 'lib/store';

import { BalancesStateInterface } from './state';

export const mockBalancesState: BalancesStateInterface = {
  balancesAtomic: createEntity({})
};
