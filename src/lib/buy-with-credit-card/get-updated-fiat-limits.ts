import { isDefined } from '@rnw-community/shared';
import axios from 'axios';

import { PairLimits } from 'app/store/buy-with-credit-card/state';
import { getMoonPayBuyQuote } from 'lib/apis/moonpay';
import { convertFiatAmountToCrypto as utorgConvertFiatAmountToCrypto } from 'lib/apis/utorg';
import { createEntity } from 'lib/store';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';

import { TopUpProviderId } from './top-up-provider-id.enum';
import { TopUpInputInterface, TopUpOutputInterface } from './topup.interface';

const getInputAmountFunctions: Partial<
  Record<TopUpProviderId, (fiatSymbol: string, cryptoSymbol: string, amount: number) => Promise<number>>
> = {
  [TopUpProviderId.MoonPay]: async (fiatSymbol, cryptoSymbol, amount) => {
    const { baseCurrencyAmount } = await getMoonPayBuyQuote(
      cryptoSymbol.toLowerCase(),
      fiatSymbol.toLowerCase(),
      undefined,
      amount
    );

    return baseCurrencyAmount;
  },
  [TopUpProviderId.Utorg]: async (fiatSymbol, cryptoSymbol, amount) =>
    utorgConvertFiatAmountToCrypto(fiatSymbol, cryptoSymbol, undefined, amount)
};

export const getUpdatedFiatLimits = async (
  fiatCurrency: TopUpInputInterface,
  cryptoCurrency: TopUpOutputInterface,
  providerId: TopUpProviderId
): Promise<PairLimits[TopUpProviderId]> => {
  const { minAmount: minCryptoAmount, maxAmount: maxCryptoAmount } = cryptoCurrency;

  const limitsResult = await Promise.all(
    [minCryptoAmount, maxCryptoAmount].map(async cryptoAmount => {
      const getInputAmount = getInputAmountFunctions[providerId];

      if (isDefined(getInputAmount) && isDefined(cryptoAmount)) {
        try {
          const result = await getInputAmount(fiatCurrency.code, cryptoCurrency.code, cryptoAmount);

          return createEntity(result);
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 400) {
            return createEntity(undefined);
          }

          return createEntity(undefined, false, getAxiosQueryErrorMessage(err));
        }
      }

      return createEntity(undefined);
    })
  );

  const [
    { data: minFiatAmountByCrypto, error: minAmountError },
    { data: maxFiatAmountByCrypto, error: maxAmountError }
  ] = limitsResult;

  const error = minAmountError ?? maxAmountError;

  return createEntity(
    isDefined(error)
      ? undefined
      : {
          min: Math.max(minFiatAmountByCrypto ?? 0, fiatCurrency.minAmount ?? 0),
          max: Math.min(maxFiatAmountByCrypto ?? Infinity, fiatCurrency.maxAmount ?? Infinity)
        },
    false,
    error
  );
};
