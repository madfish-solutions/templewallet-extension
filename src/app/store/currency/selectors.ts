import { BTC_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';

import { useSelector } from '../root-state.selector';

export const useTezosUsdToTokenRatesSelector = () => useSelector(({ currency }) => currency.usdToTokenRates.data);

export const useTezUsdToTokenRateSelector = (): string | undefined => useTezosUsdToTokenRatesSelector()[TEZ_TOKEN_SLUG];
export const useBtcUsdToTokenRateSelector = (): string | undefined => useTezosUsdToTokenRatesSelector()[BTC_TOKEN_SLUG];
