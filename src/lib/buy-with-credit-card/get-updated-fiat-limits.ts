import { isDefined } from '@rnw-community/shared';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';

import { PairLimits } from 'app/store/buy-with-credit-card/state';
import { getMoonPayBuyQuote } from 'lib/apis/moonpay';
import { getMtPelerinConvertQuote, getMtPelerinSellLimit } from 'lib/apis/mt-pelerin';
import { createEntity } from 'lib/store';
import { getAxiosQueryErrorMessage } from 'lib/utils/get-axios-query-error-message';

import { getMtPelerinNetworkByChain } from './provider-currencies.utils';
import { TopUpProviderId } from './top-up-provider-id.enum';
import { fromTopUpTokenSlug } from './top-up-token-slug.utils';
import { TopUpInputInterface, TopUpOutputInterface } from './topup.interface';

const MT_PELERIN_MAX_BUY_CHF = 100_000;
/** Arbitrary fiat amount used only to discover network/fix fees from the convert quote. */
const MT_PELERIN_FEE_PROBE_AMOUNT = 100;

const roundToFiatPrecision = (value: number, precision: number, roundingMode: BigNumber.RoundingMode) =>
  new BigNumber(value).decimalPlaces(precision, roundingMode).toNumber();

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
  }
};

const getMtPelerinUpdatedFiatLimits = async (
  fiatCurrency: TopUpInputInterface,
  cryptoCurrency: TopUpOutputInterface
): Promise<PairLimits[TopUpProviderId]> => {
  try {
    const [, chainKind, chainId] = fromTopUpTokenSlug(cryptoCurrency.slug);
    const network = getMtPelerinNetworkByChain(chainKind, chainId);

    if (!network) {
      return createEntity(undefined, false, `Mt Pelerin network is not configured for chain ${chainId}`);
    }

    const fiatCode = fiatCurrency.code.toUpperCase();
    const fractionalUnit = 10 ** -fiatCurrency.precision;
    const quotePromise = getMtPelerinConvertQuote(fiatCode, cryptoCurrency.code, MT_PELERIN_FEE_PROBE_AMOUNT, network);

    const [{ fees }, max] = await Promise.all([
      quotePromise,
      fiatCode === 'CHF'
        ? Promise.resolve(MT_PELERIN_MAX_BUY_CHF)
        : Promise.all([getMtPelerinSellLimit(fiatCode), getMtPelerinSellLimit('CHF')]).then(
            ([fiatSellLimit, chfSellLimit]) => (MT_PELERIN_MAX_BUY_CHF * fiatSellLimit) / chfSellLimit
          )
    ]);

    const min = roundToFiatPrecision(
      Number(fees.networkFee) + Number(fees.fixFee) + fractionalUnit,
      fiatCurrency.precision,
      BigNumber.ROUND_CEIL
    );
    const flooredMax = roundToFiatPrecision(max, fiatCurrency.precision, BigNumber.ROUND_FLOOR);

    return createEntity({ min, max: flooredMax });
  } catch (err) {
    return createEntity(undefined, false, getAxiosQueryErrorMessage(err));
  }
};

export const getUpdatedFiatLimits = async (
  fiatCurrency: TopUpInputInterface,
  cryptoCurrency: TopUpOutputInterface,
  providerId: TopUpProviderId
): Promise<PairLimits[TopUpProviderId]> => {
  if (providerId === TopUpProviderId.MtPelerin) {
    return getMtPelerinUpdatedFiatLimits(fiatCurrency, cryptoCurrency);
  }

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
            const { moonPayErrorCode, metadata } = err.response.data ?? {};
            if (moonPayErrorCode === '5_TM_MIN_BUY_AMOUNT_NOT_MET' && typeof metadata?.minBuyAmountBase === 'string') {
              const parsedMinBuyAmount = Number.parseFloat(metadata.minBuyAmountBase);

              if (parsedMinBuyAmount > 0) {
                return createEntity(parsedMinBuyAmount);
              }
            } else if (
              moonPayErrorCode === '5_TM_MAX_BUY_AMOUNT_EXCEEDED' &&
              typeof metadata?.maxBuyAmountBase === 'string'
            ) {
              const parsedMaxBuyAmount = Number.parseFloat(metadata.maxBuyAmountBase);

              if (parsedMaxBuyAmount > 0) {
                return createEntity(parsedMaxBuyAmount);
              }
            }

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
