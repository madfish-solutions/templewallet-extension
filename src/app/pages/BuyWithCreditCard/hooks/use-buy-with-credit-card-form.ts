import { useEffect, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import { object as objectSchema, number as numberSchema, mixed as mixedSchema } from 'yup';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { createAliceBobOrder, getMoonpaySign } from 'lib/apis/temple';
import { createOrder as createUtorgOrder } from 'lib/apis/utorg';
import { TopUpInputType } from 'lib/buy-with-credit-card/top-up-input-type.enum';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';
import { useYupValidationResolver } from 'lib/form/use-yup-validation-resolver';
import { useAccount } from 'lib/temple/front';
import { isDefined } from 'lib/utils/is-defined';

export interface BuyWithCreditCardFormValues {
  inputCurrency: TopUpInputInterface;
  inputAmount?: number;
  outputToken: TopUpOutputInterface;
  outputAmount?: number;
  topUpProvider?: PaymentProviderInterface;
}

const DEFAULT_INPUT_CURRENCY: TopUpInputInterface = {
  code: 'USD',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/usd.svg`,
  name: 'US Dollar',
  network: {
    code: '',
    fullName: '',
    shortName: ''
  },
  precision: 2,
  type: TopUpInputType.Fiat
};
const DEFAULT_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'XTZ',
  name: 'Tezos',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/xtz.svg`,
  network: {
    code: '',
    fullName: '',
    shortName: ''
  },
  precision: 1,
  slug: 'tez',
  type: TopUpInputType.Crypto
};

const defaultValues = {
  inputCurrency: DEFAULT_INPUT_CURRENCY,
  outputToken: DEFAULT_OUTPUT_TOKEN
};

export const useBuyWithCreditCardForm = () => {
  const formAnalytics = useFormAnalytics('BuyWithCreditCardForm');
  const { publicKeyHash } = useAccount();
  const userId = useUserIdSelector();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error>();

  const validationSchema = useMemo(
    () =>
      objectSchema().shape({
        inputCurrency: objectSchema().required(),
        inputAmount: mixedSchema().when('inputCurrency', ([inputCurrency]) =>
          numberSchema()
            .min(inputCurrency.minAmount ?? 0, 'minValue')
            .max(inputCurrency.maxAmount ?? Infinity, 'maxValue')
            .required('required')
        ),
        outputToken: objectSchema().required(),
        outputAmount: mixedSchema().when('outputToken', ([outputToken]) =>
          numberSchema()
            .min(outputToken.minAmount ?? 0, 'minValue')
            .max(outputToken.maxAmount ?? Infinity, 'maxValue')
            .required('required')
        ),
        topUpProvider: objectSchema().required()
      }),
    []
  );
  const validationResolver = useYupValidationResolver<BuyWithCreditCardFormValues>(validationSchema);

  const { handleSubmit, errors, watch, register, ...rest } = useForm<BuyWithCreditCardFormValues>({
    defaultValues,
    validationResolver
  });
  const formValues = watch({ nest: true });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async () => {
        const { inputAmount, inputCurrency, outputAmount, outputToken, topUpProvider } = formValues;

        if (isSubmitting || !isDefined(inputAmount) || !isDefined(outputAmount) || !isDefined(topUpProvider)) {
          return;
        }

        const analyticsProperties = {
          inputAmount,
          inputAsset: inputCurrency.code,
          outputAmount,
          outputAsset: outputToken.code,
          provider: topUpProvider.id
        };
        try {
          setSubmitError(undefined);
          setIsSubmitting(true);
          formAnalytics.trackSubmit(analyticsProperties);

          let urlToOpen: string;
          switch (topUpProvider.id) {
            case TopUpProviderId.MoonPay:
              urlToOpen = await getMoonpaySign(
                outputToken.code,
                '#ed8936',
                publicKeyHash,
                inputAmount,
                inputCurrency.code
              );
              break;
            case TopUpProviderId.Utorg:
              urlToOpen = await createUtorgOrder(outputAmount, inputCurrency.code, publicKeyHash, outputToken.code);
              break;
            default:
              const { data } = await createAliceBobOrder(false, inputAmount.toFixed(), userId, publicKeyHash);
              urlToOpen = data.orderInfo.payUrl;
          }
          formAnalytics.trackSubmitSuccess(analyticsProperties);
          window.open(urlToOpen, '_blank');
        } catch (error: any) {
          setSubmitError(error);
          formAnalytics.trackSubmitFail(analyticsProperties);
        } finally {
          setIsSubmitting(false);
        }
      }),
    [handleSubmit, formValues, publicKeyHash, userId, formAnalytics, isSubmitting]
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
    onSubmit,
    errors,
    submitError,
    ...rest
  };
};
