import { useSelector } from '../../root-state.selector';

export const useEvmUsdToTokenRatesSelector = () => useSelector(({ evmCurrency }) => evmCurrency.usdToTokenRates);
