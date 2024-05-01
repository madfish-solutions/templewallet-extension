import { useSelector } from '../../root-state.selector';

export const useEvmStoredCollectiblesRecordSelector = () => useSelector(state => state.evmCollectibles.record);
