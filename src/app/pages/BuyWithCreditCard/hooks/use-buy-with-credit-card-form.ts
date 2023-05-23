import { useCallback, useEffect, useMemo, useState } from 'react';

import debounce from 'debounce-promise';
import { useForm } from 'react-hook-form';
import { object as objectSchema, number as numberSchema, mixed as mixedSchema } from 'yup';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { createBinanceConnectTradeOrder } from 'lib/apis/binance-connect';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { createAliceBobOrder, getMoonpaySign } from 'lib/apis/temple';
import { createOrder as createUtorgOrder } from 'lib/apis/utorg';
import { TopUpInputType } from 'lib/buy-with-credit-card/top-up-input-type.enum';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { useAccount } from 'lib/temple/front';
import { useStopper } from 'lib/ui/hooks';
import { isDefined } from 'lib/utils/is-defined';

import { AmountErrorType } from '../types/amount-error-type';
import { BuyWithCreditCardFormValues } from '../types/buy-with-credit-card-form-values';

const DEFAULT_INPUT_CURRENCY: TopUpInputInterface = {
  code: 'USD',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/usd.svg`,
  name: 'US Dollar',
  precision: 2,
  type: TopUpInputType.Fiat
};

const DEFAULT_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'XTZ',
  name: 'Tezos',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/xtz.svg`,
  precision: 1,
  slug: 'tez',
  type: TopUpInputType.Crypto
};

const defaultValues = {
  inputCurrency: DEFAULT_INPUT_CURRENCY,
  outputToken: DEFAULT_OUTPUT_TOKEN
};

const validationSchema = objectSchema().shape({
  inputCurrency: objectSchema().required(),
  inputAmount: mixedSchema().when('inputCurrency', ([inputCurrency]) =>
    numberSchema()
      .positive(AmountErrorType.Min)
      .min(inputCurrency.minAmount ?? 0, AmountErrorType.Min)
      .max(inputCurrency.maxAmount ?? Infinity, AmountErrorType.Max)
      .required(AmountErrorType.Required)
  ),
  outputToken: objectSchema().required(),
  outputAmount: numberSchema().required(AmountErrorType.Required),
  topUpProvider: objectSchema().required()
});

export const useBuyWithCreditCardForm = () => {
  const validationResolver = useYupValidationResolver<BuyWithCreditCardFormValues>(validationSchema);

  const { errors, watch, register, setValue, getValues, ...rest } = useForm<BuyWithCreditCardFormValues>({
    defaultValues,
    validationResolver
  });

  const formValues = watch({ nest: true });

  const purchaseLinkVars = usePurchaseLink(formValues);

  const lazySetValue = useCallback(
    (newValues: Partial<BuyWithCreditCardFormValues>, shouldValidate?: boolean) => {
      const currentValues = getValues();
      const changes: Array<Partial<BuyWithCreditCardFormValues>> = [];
      for (const fieldName in newValues) {
        const value = newValues[fieldName as keyof BuyWithCreditCardFormValues];
        if (value !== currentValues[fieldName as keyof BuyWithCreditCardFormValues]) {
          changes.push({ [fieldName]: value });
        }
      }
      if (changes.length > 0) {
        setValue(changes, shouldValidate);
      }
    },
    [setValue, getValues]
  );

  useEffect(() => {
    register('inputCurrency');
    register('inputAmount');
    register('outputToken');
    register('outputAmount');
    register('topUpProvider');
  }, [register]);

  return {
    formValues,
    errors,
    lazySetValue,
    setValue,
    getValues,
    ...purchaseLinkVars,
    ...rest
  };
};

const usePurchaseLink = (formValues: BuyWithCreditCardFormValues) => {
  const formAnalytics = useFormAnalytics('BuyWithCreditCardForm');
  const { publicKeyHash } = useAccount();
  const userId = useUserIdSelector();

  const [purchaseLinkLoading, setPurchaseLinkLoading] = useState(false);
  const [purchaseLink, setPurchaseLink] = useState<string>();
  const [updateLinkError, setUpdateLinkError] = useState<Error>();

  const loadingPurchaseLinkStopper = useStopper();

  const updatePurchaseLink = useMemo(
    () =>
      debounce(async (shouldStop: () => boolean) => {
        setPurchaseLink(undefined);
        setUpdateLinkError(undefined);

        const { inputAmount, inputCurrency, outputAmount, outputToken, topUpProvider } = formValues;

        if (!isDefined(inputAmount) || !isDefined(outputAmount) || !isDefined(topUpProvider)) {
          setPurchaseLinkLoading(false);
          return;
        }

        setPurchaseLinkLoading(true);

        try {
          let newPurchaseLink: string;
          switch (topUpProvider.id) {
            case TopUpProviderId.MoonPay:
              newPurchaseLink = await getMoonpaySign(
                outputToken.code,
                '#ed8936',
                publicKeyHash,
                inputAmount,
                inputCurrency.code
              );
              break;
            case TopUpProviderId.Utorg:
              newPurchaseLink = await createUtorgOrder(
                outputAmount,
                inputCurrency.code,
                publicKeyHash,
                outputToken.code
              );
              break;
            case TopUpProviderId.BinanceConnect:
              newPurchaseLink = await createBinanceConnectTradeOrder(
                inputCurrency.code,
                outputToken.code,
                inputAmount,
                publicKeyHash
              );
              break;
            default:
              const { data } = await createAliceBobOrder(false, inputAmount.toFixed(), userId, publicKeyHash);
              newPurchaseLink = data.orderInfo.payUrl;
          }

          if (shouldStop()) return;
          setPurchaseLink(newPurchaseLink);
        } catch (error: any) {
          if (shouldStop()) return;
          setUpdateLinkError(error);

          const analyticsProperties = {
            inputAmount,
            inputAsset: inputCurrency.code,
            outputAmount,
            outputAsset: outputToken.code,
            provider: topUpProvider.id
          };
          formAnalytics.trackSubmitFail(analyticsProperties);
        } finally {
          if (shouldStop()) return;
          setPurchaseLinkLoading(false);
        }
      }, 250),
    [
      formValues.inputCurrency.code,
      formValues.inputAmount,
      formValues.outputToken.code,
      formValues.outputAmount,
      formValues.topUpProvider?.id,
      publicKeyHash,
      userId,
      formAnalytics
    ]
  );

  useEffect(() => {
    updatePurchaseLink(loadingPurchaseLinkStopper.stopAndBuildChecker());

    return loadingPurchaseLinkStopper.stop;
  }, [
    // formValues.inputCurrency.code,
    // formValues.inputAmount,
    // formValues.outputToken.code,
    // formValues.outputAmount,
    // formValues.topUpProvider?.id,
    updatePurchaseLink,
    loadingPurchaseLinkStopper
  ]);

  return {
    purchaseLink,
    purchaseLinkLoading,
    updateLinkError
  };
};
