import { useCallback, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { object as objectSchema, number as numberSchema, mixed as mixedSchema } from 'yup';

import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';

import { AmountErrorType } from '../types/amount-error-type';
import { BuyWithCreditCardFormValues } from '../types/buy-with-credit-card-form-values';
import { usePurchaseLink } from './use-purchase-link';

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
