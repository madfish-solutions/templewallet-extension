import { useSelector } from '../index';

export const useUsdToTokenRatesSelector = () => useSelector(({ currency }) => currency.usdToTokenRates.data);
