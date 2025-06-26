import { useSelector } from '../root-state.selector';

export const useAccountsInitializedState = () => useSelector(state => state.accountsInitialization.values);

export const useIsAccountInitializedSelector = (accountId: string) =>
  useSelector(state => state.accountsInitialization.values[accountId]?.data);

export const useIsAccountInitializedLoadingSelector = (accountId: string) =>
  useSelector(state => state.accountsInitialization.values[accountId]?.isLoading);
