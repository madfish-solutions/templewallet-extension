import { LoadableEntityState } from 'lib/store';

export interface AccountsInitializationState {
  values: StringRecord<LoadableEntityState<boolean | undefined>>;
}

export const accountsInitializationInitialState: AccountsInitializationState = {
  values: {}
};
