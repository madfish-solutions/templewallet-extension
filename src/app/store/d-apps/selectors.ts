import { useSelector } from '../index';

export const useTokensApyRatesSelector = () => useSelector(({ dApps }) => dApps.tokensApyRates);
