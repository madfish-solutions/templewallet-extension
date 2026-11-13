import { useSelector } from 'app/store/root-state.selector';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

export const useEvmCollectiblesInventorySelector = (account: HexString | undefined) =>
  useSelector(state => (account ? state.evmCollectiblesInventory.byAccount[account] : undefined)) ?? EMPTY_FROZEN_OBJ;

export const useEvmCollectiblesInventoryLoadingSelector = () =>
  useSelector(state => state.evmCollectiblesInventory.loading || state.evmCollectiblesInventory.searchLoading);

export const useEvmCollectiblesSearchSelector = () => useSelector(state => state.evmCollectiblesInventory);
