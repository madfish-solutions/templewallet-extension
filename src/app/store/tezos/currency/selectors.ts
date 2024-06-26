import { useSelector } from '../../root-state.selector';

export const useTezosUsdToTokenRatesSelector = () => useSelector(({ currency }) => currency.usdToTokenRates.data);
