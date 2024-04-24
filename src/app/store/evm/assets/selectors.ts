import { useSelector } from '../../root-state.selector';

export const useAllEVMTokensSelector = () => useSelector(state => state.evmAssets.tokens);

export const useAccountEVMTokensSelector = (publicKeyHash: string) =>
  useSelector(state => state.evmAssets.tokens[publicKeyHash]) ?? {};
