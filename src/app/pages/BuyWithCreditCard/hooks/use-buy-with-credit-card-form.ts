import { useCallback, useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useForm } from 'react-hook-form';
import browser from 'webextension-polyfill';
import { object as objectSchema, number as numberSchema, mixed as mixedSchema } from 'yup';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { AnalyticsEventCategory, useAnalytics, useFormAnalytics } from 'lib/analytics';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { createAliceBobOrder, getMoonpaySign } from 'lib/apis/temple';
import { createOrder as createUtorgOrder } from 'lib/apis/utorg';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { useAccount } from 'lib/temple/front';
import { assertUnreachable } from 'lib/utils/switch-cases';

import { AmountErrorType } from '../types/amount-error-type';
import { BuyWithCreditCardFormValues } from '../types/buy-with-credit-card-form-values';

const DEFAULT_INPUT_CURRENCY: TopUpInputInterface = {
  code: 'USD',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/usd.svg`,
  name: 'US Dollar',
  precision: 2
};

const DEFAULT_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'XTZ',
  name: 'Tezos',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/xtz.svg`,
  precision: 1,
  slug: 'tez'
};

const defaultValues = {
  inputCurrency: DEFAULT_INPUT_CURRENCY,
  outputToken: DEFAULT_OUTPUT_TOKEN
};

const validationSchema = objectSchema().shape({
  inputCurrency: objectSchema().required(),
  inputAmount: mixedSchema().when('inputCurrency', ([inputCurrency]) =>
    numberSchema()
      .positive(AmountErrorType.Positive)
      .min(inputCurrency.minAmount ?? 0, AmountErrorType.Min)
      .max(inputCurrency.maxAmount ?? Infinity, AmountErrorType.Max)
      .required(AmountErrorType.Required)
  ),
  outputToken: objectSchema().required(),
  outputAmount: numberSchema().required(AmountErrorType.Required).positive(AmountErrorType.Positive),
  topUpProvider: objectSchema().required()
});

export const useBuyWithCreditCardForm = () => {
  const { trackEvent } = useAnalytics();
  const validationResolver = useYupValidationResolver<BuyWithCreditCardFormValues>(validationSchema);

  const formAnalytics = useFormAnalytics('BuyWithCreditCardForm');
  const { publicKeyHash } = useAccount();
  const userId = useUserIdSelector();

  const [purchaseLinkLoading, setPurchaseLinkLoading] = useState(false);
  const [purchaseLinkError, setPurchaseLinkError] = useState<Error>();

  const { errors, watch, register, setValue, getValues, ...rest } = useForm<BuyWithCreditCardFormValues>({
    defaultValues,
    validationResolver
  });

  const formValues = watch({ nest: true });

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

  const onSubmit = useCallback(
    async (formValues: BuyWithCreditCardFormValues) => {
      const { inputAmount, inputCurrency, outputAmount, outputToken, topUpProvider } = formValues;

      trackEvent('BUY_WITH_CREDIT_CARD_FORM_SUBMIT', AnalyticsEventCategory.FormSubmit, {
        inputAmount: inputAmount?.toString(),
        inputAsset: inputCurrency.code,
        outputAmount: outputAmount?.toString(),
        outputAsset: outputToken.code,
        provider: topUpProvider?.name
      });

      if (
        !isDefined(topUpProvider?.outputAmount) ||
        !isDefined(inputAmount) ||
        !isDefined(outputAmount) ||
        !isDefined(topUpProvider)
      ) {
        setPurchaseLinkLoading(false);
        return;
      }

      setPurchaseLinkLoading(true);

      try {
        let url: string;
        switch (topUpProvider.id) {
          case TopUpProviderId.MoonPay:
            url = await getMoonpaySign(outputToken.code, '#ed8936', publicKeyHash, inputAmount, inputCurrency.code);
            break;
          case TopUpProviderId.Utorg:
            url = await createUtorgOrder(outputAmount, inputCurrency.code, publicKeyHash, outputToken.code);
            break;
          case TopUpProviderId.AliceBob:
            const { data } = await createAliceBobOrder(
              inputAmount.toFixed(),
              inputCurrency.code,
              outputToken.code,
              userId,
              publicKeyHash
            );
            url = data.orderInfo.payUrl;
            break;
          default:
            return assertUnreachable(topUpProvider.id);
        }

        await browser.tabs.create({ url });
      } catch (error: any) {
        setPurchaseLinkError(error);

        const analyticsProperties = {
          inputAmount,
          inputAsset: inputCurrency.code,
          outputAmount,
          outputAsset: outputToken.code,
          provider: topUpProvider.id
        };
        formAnalytics.trackSubmitFail(analyticsProperties);
      } finally {
        setPurchaseLinkLoading(false);
      }
    },
    [formAnalytics, publicKeyHash, userId]
  );

  return {
    formValues,
    errors,
    lazySetValue,
    setValue,
    getValues,
    onSubmit,
    purchaseLinkError,
    purchaseLinkLoading,
    ...rest
  };
};
