import { useSelector } from '../../root-state.selector';

export const useEvmUsdToTokenRatesSelector = () =>
  useSelector(({ evmTokensExchangeRates }) => evmTokensExchangeRates.usdToTokenRates);
