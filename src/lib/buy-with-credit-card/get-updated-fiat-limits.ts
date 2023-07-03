import { isDefined } from '@rnw-community/shared';
import axios from 'axios';

import { PairLimits } from 'app/store/buy-with-credit-card/state';
import { getMoonPayBuyQuote } from 'lib/apis/moonpay';
import { getBinanceConnectBuyPair } from 'lib/apis/temple-static';
import { convertFiatAmountToCrypto as utorgConvertFiatAmountToCrypto } from 'lib/apis/utorg';
import { createEntity } from 'lib/store';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';

import { PAIR_NOT_FOUND_MESSAGE } from './constants';
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

  const limitsResult =
    providerId === TopUpProviderId.BinanceConnect
      ? await getBinanceConnectPair(fiatCurrency.code, cryptoCurrency.code).then(
          pair => [createEntity(pair.minLimit), createEntity(pair.maxLimit)],
          error => {
            const message = error instanceof Error ? error.message : undefined;
            return [createEntity(undefined, false, message), createEntity(undefined, false, message)];
          }
        )
      : await Promise.all(
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

const getBinanceConnectPair = (fiatCode: string, cryptoCode: string) =>
  getBinanceConnectBuyPair(fiatCode, cryptoCode).catch(error => {
    if (!axios.isAxiosError(error)) throw new Error('Unknown error');
    if (error.response && [400, 404].includes(error.response.status)) throw new Error(PAIR_NOT_FOUND_MESSAGE);
    throw new Error(getAxiosQueryErrorMessage(error));
  });
