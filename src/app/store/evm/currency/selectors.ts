import { useSelector } from '../../index';

export const useEVMUsdToTokenRatesSelector = () => useSelector(({ evmCurrency }) => evmCurrency.usdToTokenRates);
