import { useSelector } from '../../root-state.selector';

export const useEvmStoredAssetsRecordSelector = () => useSelector(state => state.evmAssets.assets);
