import { LoadableEntityState } from 'lib/store/interfaces/loadable-entity-state.interface';
import { createEntity } from 'lib/store/utils/entity.utils';

export interface BalancesStateInterface {
  balancesAtomic: LoadableEntityState<Record<string, string>>;
}

export const balancesInitialState: BalancesStateInterface = {
  balancesAtomic: createEntity({})
};
