import { useSelector } from '../../root-state.selector';

export const useEvmStoredTokensRecordSelector = () => useSelector(state => state.evmTokens.record);
