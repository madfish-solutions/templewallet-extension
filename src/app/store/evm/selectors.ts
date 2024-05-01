import { useSelector } from '../root-state.selector';

export const useEvmTokensLoadingStateRecordSelector = () => useSelector(state => state.evm.tokensLoadingStateRecord);
