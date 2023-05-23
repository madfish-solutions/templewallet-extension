import { useCallback, useMemo, useState } from 'react';

import { BigNumber } from 'bignumber.js';

import { useFiatCurrenciesSelector, useCryptoCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { estimateBinanceConnectOutput } from 'lib/apis/binance-connect';
import { getMoonPayBuyQuote } from 'lib/apis/moonpay';
import { estimateAliceBobOutput } from 'lib/apis/temple/endpoints/alice-bob';
import { convertFiatAmountToCrypto } from 'lib/apis/utorg';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { getUpdatedFiatLimits } from 'lib/buy-with-credit-card/get-updated-fiat-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';
import { isTruthy } from 'lib/utils';
import { isDefined } from 'lib/utils/is-defined';
import { percentageToFraction } from 'lib/utils/percentage';

import { useInputLimits } from './use-input-limits';

type getOutputAmountFunction = (
  inputAmount: number,
  inputAsset: TopUpInputInterface,
  outputAsset: TopUpOutputInterface
) => Promise<number>;

type PaymentProviderInitialData = Pick<PaymentProviderInterface, 'name' | 'id' | 'kycRequired'>;

const getOutputAmountFunctions: Record<TopUpProviderId, getOutputAmountFunction> = {
  [TopUpProviderId.MoonPay]: async (inputAmount, inputAsset, outputAsset) => {
    const { baseCurrencyAmount, quoteCurrencyAmount, extraFeePercentage, feeAmount, networkFeeAmount, totalAmount } =
      await getMoonPayBuyQuote(outputAsset.code.toLowerCase(), inputAsset.code.toLowerCase(), inputAmount);

    if (inputAmount < totalAmount) {
      const expectedBaseCurrencyAmount = BigNumber.max(
        new BigNumber(inputAmount)
          .minus(feeAmount)
          .minus(networkFeeAmount)
          .div(new BigNumber(1).plus(percentageToFraction(extraFeePercentage)))
          .decimalPlaces(inputAsset.precision ?? 0, BigNumber.ROUND_DOWN),
        0
      );

      return expectedBaseCurrencyAmount
        .times(quoteCurrencyAmount)
        .div(baseCurrencyAmount)
        .decimalPlaces(outputAsset.precision ?? 0, BigNumber.ROUND_DOWN)
        .toNumber();
    }

    return quoteCurrencyAmount;
  },
  [TopUpProviderId.Utorg]: async (inputAmount, inputAsset, outputAsset) =>
    convertFiatAmountToCrypto(inputAsset.code, outputAsset.code, inputAmount),
  [TopUpProviderId.AliceBob]: async inputAmount => {
    const response = await estimateAliceBobOutput(false, inputAmount.toString());

    return response.data.outputAmount;
  },
  [TopUpProviderId.BinanceConnect]: async (inputAmount, inputAsset, outputAsset) => {
    const response = await estimateBinanceConnectOutput(inputAsset.code, outputAsset.code, String(inputAmount));

    // return response.data.outputAmount;
    return response;
  }
};

const initialPaymentProvidersData: Record<TopUpProviderId, PaymentProviderInitialData> = {
  [TopUpProviderId.MoonPay]: {
    name: 'MoonPay',
    id: TopUpProviderId.MoonPay,
    kycRequired: true
  },
  [TopUpProviderId.Utorg]: {
    name: 'Utorg',
    id: TopUpProviderId.Utorg,
    kycRequired: true
  },
  [TopUpProviderId.AliceBob]: {
    name: 'Alice&Bob',
    id: TopUpProviderId.AliceBob,
    kycRequired: false
  },
  [TopUpProviderId.BinanceConnect]: {
    name: 'Binance',
    id: TopUpProviderId.BinanceConnect,
    kycRequired: true
  }
};

const usePaymentProvider = (
  providerId: TopUpProviderId,
  inputAmount: number | undefined,
  inputAsset: TopUpInputInterface,
  outputAsset: TopUpOutputInterface
) => {
  const [outputAmount, setOutputAmount] = useState<number>();
  const [error, setError] = useState<Error>();
  const [outputAmountLoading, setOutputAmountLoading] = useState<boolean>(false);
  const fiatCurrencies = useFiatCurrenciesSelector(providerId);
  const cryptoCurrencies = useCryptoCurrenciesSelector(providerId);
  const { min: minInputAmount, max: maxInputAmount } = useInputLimits(providerId, inputAsset.code, outputAsset.code);
  const initialData = initialPaymentProvidersData[providerId];
  const getOutputAmount = getOutputAmountFunctions[providerId];

  const updateOutputAmount = useCallback(
    async (newInputAmount?: number, newInputAsset = inputAsset, newOutputAsset = outputAsset) => {
      setError(undefined);
      const currentProviderFiatCurrency = fiatCurrencies.find(({ code }) => code === newInputAsset.code);
      const currentProviderCryptoCurrency = cryptoCurrencies.find(({ code }) => code === newOutputAsset.code);
      const updatedPairLimits =
        isDefined(currentProviderFiatCurrency) && isDefined(currentProviderCryptoCurrency)
          ? (await getUpdatedFiatLimits(currentProviderFiatCurrency, currentProviderCryptoCurrency, providerId)).data
          : undefined;

      if (
        !isTruthy(newInputAmount) ||
        !isDefined(updatedPairLimits) ||
        newInputAmount < updatedPairLimits.min ||
        newInputAmount > updatedPairLimits.max
      ) {
        const newOutputAmount = newInputAmount === 0 ? 0 : undefined;
        setOutputAmount(newOutputAmount);

        return newOutputAmount;
      }

      let newOutputAmount: number | undefined;
      try {
        setOutputAmountLoading(true);
        newOutputAmount = await getOutputAmount(newInputAmount, newInputAsset, newOutputAsset);
      } catch (error) {
        setError(error as Error);
        newOutputAmount = undefined;
      } finally {
        setOutputAmount(newOutputAmount);
        setOutputAmountLoading(false);
      }

      return newOutputAmount;
    },
    [inputAsset, outputAsset, getOutputAmount, providerId, fiatCurrencies, cryptoCurrencies]
  );

  const provider = useMemo<PaymentProviderInterface>(
    () => ({
      ...initialData,
      isBestPrice: false,
      minInputAmount,
      maxInputAmount,
      inputAmount,
      inputDecimals: inputAsset.precision,
      inputSymbol: getAssetSymbolToDisplay(inputAsset),
      outputAmount,
      outputSymbol: getAssetSymbolToDisplay(outputAsset)
    }),
    [initialData, inputAmount, inputAsset, outputAmount, outputAsset, minInputAmount, maxInputAmount]
  );

  return {
    provider,
    error,
    updateOutputAmount,
    loading: outputAmountLoading
  };
};

export const usePaymentProviders = (
  inputAmount: number | undefined,
  inputAsset: TopUpInputInterface,
  outputAsset: TopUpOutputInterface
) => {
  const {
    error: moonPayError,
    provider: moonPayProvider,
    updateOutputAmount: updateMoonPayOutputAmount,
    loading: moonPayLoading
  } = usePaymentProvider(TopUpProviderId.MoonPay, inputAmount, inputAsset, outputAsset);
  const {
    error: utorgError,
    provider: utorgProvider,
    updateOutputAmount: updateUtorgOutputAmount,
    loading: utorgLoading
  } = usePaymentProvider(TopUpProviderId.Utorg, inputAmount, inputAsset, outputAsset);
  const {
    error: aliceBobError,
    provider: aliceBobProvider,
    updateOutputAmount: updateAliceBobOutputAmount,
    loading: aliceBobLoading
  } = usePaymentProvider(TopUpProviderId.AliceBob, inputAmount, inputAsset, outputAsset);
  const {
    error: binanceConnectError,
    provider: binanceConnectProvider,
    updateOutputAmount: updateBinanceConnectOutputAmount,
    loading: binanceConnectLoading
  } = usePaymentProvider(TopUpProviderId.BinanceConnect, inputAmount, inputAsset, outputAsset);

  const allPaymentProviders = useMemo(
    () => [moonPayProvider, utorgProvider, aliceBobProvider, binanceConnectProvider],
    [moonPayProvider, utorgProvider, aliceBobProvider, binanceConnectProvider]
  );

  const amountsUpdateErrors = useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayError,
      [TopUpProviderId.Utorg]: utorgError,
      [TopUpProviderId.AliceBob]: aliceBobError,
      [TopUpProviderId.BinanceConnect]: binanceConnectError
    }),
    [moonPayError, utorgError, aliceBobError, binanceConnectError]
  );

  const paymentProvidersToDisplay = useMemo(
    () =>
      getPaymentProvidersToDisplay(
        allPaymentProviders,
        amountsUpdateErrors,
        {
          [TopUpProviderId.MoonPay]: moonPayLoading,
          [TopUpProviderId.Utorg]: utorgLoading,
          [TopUpProviderId.AliceBob]: aliceBobLoading,
          [TopUpProviderId.BinanceConnect]: binanceConnectLoading
        },
        inputAmount
      ),
    [allPaymentProviders, amountsUpdateErrors, moonPayLoading, utorgLoading, aliceBobLoading, binanceConnectLoading]
  );

  const updateOutputAmounts = useCallback(
    async (newInputAmount?: number, newInputAsset = inputAsset, newOutputAsset = outputAsset) => {
      const [moonPayOutputAmount, utorgOutputAmount, aliceBobOutputAmount, binanceConnectOutputAmount] =
        await Promise.all([
          updateMoonPayOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
          updateUtorgOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
          updateAliceBobOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
          updateBinanceConnectOutputAmount(newInputAmount, newInputAsset, newOutputAsset)
        ]);

      return {
        [TopUpProviderId.MoonPay]: moonPayOutputAmount,
        [TopUpProviderId.Utorg]: utorgOutputAmount,
        [TopUpProviderId.AliceBob]: aliceBobOutputAmount,
        [TopUpProviderId.BinanceConnect]: binanceConnectOutputAmount
      };
    },
    [inputAsset, outputAsset, updateMoonPayOutputAmount, updateUtorgOutputAmount, updateAliceBobOutputAmount]
  );
  const loading = moonPayLoading || utorgLoading || aliceBobLoading || binanceConnectLoading;

  return { allPaymentProviders, amountsUpdateErrors, paymentProvidersToDisplay, updateOutputAmounts, loading };
};
