import { useCallback, useMemo, useState } from 'react';

import { BigNumber } from 'bignumber.js';

import { useFiatCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { getMoonPayBuyQuote } from 'lib/apis/moonpay';
import { estimateAliceBobOutput } from 'lib/apis/temple/endpoints/alice-bob';
import { convertFiatAmountToCrypto } from 'lib/apis/utorg';
import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';
import { isTruthy } from 'lib/utils';
import { isDefined } from 'lib/utils/is-defined';

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
          .div(1 + extraFeePercentage / 100)
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
    convertFiatAmountToCrypto(inputAmount, inputAsset.code, outputAsset.code),
  [TopUpProviderId.AliceBob]: async inputAmount => {
    const response = await estimateAliceBobOutput(false, inputAmount.toString());

    return response.data.outputAmount;
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
  const { minAmount, maxAmount } = useInputLimits(providerId, inputAsset.code);
  const initialData = initialPaymentProvidersData[providerId];
  const getOutputAmount = getOutputAmountFunctions[providerId];

  const updateOutputAmount = useCallback(
    async (newInputAmount?: number, newInputAsset = inputAsset, newOutputAsset = outputAsset) => {
      setError(undefined);
      const currentProviderCurrency = fiatCurrencies.find(({ code }) => code === newInputAsset.code);
      if (
        !isTruthy(newInputAmount) ||
        !isDefined(currentProviderCurrency?.minAmount) ||
        !isDefined(currentProviderCurrency?.maxAmount)
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
    [inputAsset, outputAsset, getOutputAmount, providerId, fiatCurrencies]
  );

  const provider = useMemo<PaymentProviderInterface>(
    () => ({
      ...initialData,
      isBestPrice: false,
      minInputAmount: minAmount,
      maxInputAmount: maxAmount,
      inputAmount,
      inputDecimals: inputAsset.precision,
      inputSymbol: inputAsset.code,
      outputAmount,
      outputSymbol: outputAsset.code
    }),
    [initialData, inputAmount, inputAsset, outputAmount, outputAsset, minAmount, maxAmount]
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

  const allPaymentProviders = useMemo(
    () => [moonPayProvider, utorgProvider, aliceBobProvider],
    [moonPayProvider, utorgProvider, aliceBobProvider]
  );

  const amountsUpdateErrors = useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayError,
      [TopUpProviderId.Utorg]: utorgError,
      [TopUpProviderId.AliceBob]: aliceBobError
    }),
    [moonPayError, utorgError, aliceBobError]
  );

  const paymentProvidersToDisplay = useMemo(
    () =>
      getPaymentProvidersToDisplay(
        allPaymentProviders,
        amountsUpdateErrors,
        {
          [TopUpProviderId.MoonPay]: moonPayLoading,
          [TopUpProviderId.Utorg]: utorgLoading,
          [TopUpProviderId.AliceBob]: aliceBobLoading
        },
        inputAmount
      ),
    [allPaymentProviders, amountsUpdateErrors, moonPayLoading, utorgLoading, aliceBobLoading]
  );
  const updateOutputAmounts = useCallback(
    async (newInputAmount?: number, newInputAsset = inputAsset, newOutputAsset = outputAsset) => {
      const [moonPayOutputAmount, utorgOutputAmount, aliceBobOutputAmount] = await Promise.all([
        updateMoonPayOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
        updateUtorgOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
        updateAliceBobOutputAmount(newInputAmount, newInputAsset, newOutputAsset)
      ]);

      return {
        [TopUpProviderId.MoonPay]: moonPayOutputAmount,
        [TopUpProviderId.Utorg]: utorgOutputAmount,
        [TopUpProviderId.AliceBob]: aliceBobOutputAmount
      };
    },
    [inputAsset, outputAsset, updateMoonPayOutputAmount, updateUtorgOutputAmount, updateAliceBobOutputAmount]
  );
  const loading = moonPayLoading || utorgLoading || aliceBobLoading;

  return { allPaymentProviders, amountsUpdateErrors, paymentProvidersToDisplay, updateOutputAmounts, loading };
};
