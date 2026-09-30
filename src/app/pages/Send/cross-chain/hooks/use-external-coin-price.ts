import BigNumber from 'bignumber.js';

import { useBtcToUsdRateSelector } from 'app/store/currency/selectors';
import { BTC_EXOLIX_COIN_CODE } from 'lib/cross-chain/constants';
import { useFiatToUsdRate } from 'lib/fiat-currency';

export const useExternalCoinPrice = (exolixCoin: string): BigNumber => {
  const btcToUsdRate = useBtcToUsdRateSelector();
  const fiatToUsdRate = useFiatToUsdRate();

  if (exolixCoin !== BTC_EXOLIX_COIN_CODE || btcToUsdRate == null || fiatToUsdRate == null) return new BigNumber(0);

  return new BigNumber(btcToUsdRate).times(fiatToUsdRate);
};
