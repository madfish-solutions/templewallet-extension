import { useSelector } from 'app/store/root-state.selector';
import { TEZ_TOKEN_SLUG } from 'lib/assets/defaults';

export const useTezosUsdToTokenRatesSelector = () => useSelector(({ currency }) => currency.usdToTokenRates.data);

export const useTezUsdToTokenRateSelector = (): string | undefined =>
  useSelector(({ currency }) => currency.usdToTokenRates.data[TEZ_TOKEN_SLUG]);

export const useBtcToUsdRateSelector = (): number | null => useSelector(({ currency }) => currency.btcToUsdRate.data);
