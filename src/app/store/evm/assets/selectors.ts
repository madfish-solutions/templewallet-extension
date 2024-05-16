import { useSelector } from '../../root-state.selector';
export const useEvmStoredTokensRecordSelector = () => useSelector(state => state.evmAssets.tokens);

export const useEvmStoredCollectiblesRecordSelector = () => useSelector(state => state.evmAssets.collectibles);
