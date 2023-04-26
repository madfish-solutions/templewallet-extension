import React, { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import debounce from 'debounce-promise';
import isEqual from 'lodash.isequal';
import { useDispatch } from 'react-redux';

import { FormSubmitButton } from 'app/atoms';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ArrowDownIcon } from 'app/icons/arrow-down.svg';
import PageLayout from 'app/layouts/PageLayout';
import { loadAllCurrenciesActions } from 'app/store/buy-with-credit-card/actions';
import { PaymentProviderInput } from 'app/templates/PaymentProviderInput';
import { SpinnerSection } from 'app/templates/SendForm/SpinnerSection';
import { TopUpInput } from 'app/templates/TopUpInput';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface, TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t, T, toLocalFormat } from 'lib/i18n';
import { useInterval } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { isDefined } from 'lib/utils/is-defined';

import { useAllCryptoCurrencies } from './hooks/use-all-crypto-currencies';
import { useAllFiatCurrencies } from './hooks/use-all-fiat-currencies';
import { useBuyWithCreditCardForm } from './hooks/use-buy-with-credit-card-form';
import { usePaymentProviders } from './hooks/use-payment-providers';

const fitFiatIconFn = (currency: TopUpInputInterface) => !currency.icon.startsWith(MOONPAY_ASSETS_BASE_URL);

export const BuyWithCreditCard: FC = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const allFiatCurrencies = useAllFiatCurrencies();
  const allCryptoCurrencies = useAllCryptoCurrencies();
  const { formValues, onSubmit, errors, setValue, triggerValidation, formState } = useBuyWithCreditCardForm();
  const { inputAmount, inputCurrency, outputToken, outputAmount, topUpProvider } = formValues;
  const manuallySelectedProviderIdRef = useRef<TopUpProviderId>();
  const { allPaymentProviders, paymentProvidersToDisplay, updateOutputAmounts } = usePaymentProviders(
    inputAmount,
    inputCurrency,
    outputToken
  );

  const shouldShowPaymentProviderError =
    isDefined(errors.topUpProvider) &&
    (isTruthy(formState.touched.topUpProvider) || formState.submitCount > 0) &&
    paymentProvidersToDisplay.length > 0;

  const switchPaymentProvider = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      const newOutputAmount = newProvider?.outputAmount;
      setValue([{ topUpProvider: newProvider }, { outputAmount: newOutputAmount }]);
      triggerValidation();
    },
    [setValue, allPaymentProviders, triggerValidation]
  );

  useEffect(() => void dispatch(loadAllCurrenciesActions.submit()), []);

  useEffect(() => {
    const newInputAsset = allFiatCurrencies.find(({ code }) => code === inputCurrency.code);

    if (isDefined(newInputAsset) && !isEqual(newInputAsset, inputCurrency)) {
      setValue([
        { inputCurrency: newInputAsset },
        {
          inputAmount:
            isDefined(newInputAsset.precision) && isDefined(inputAmount)
              ? new BigNumber(inputAmount).decimalPlaces(newInputAsset.precision).toNumber()
              : inputAmount
        }
      ]);
      triggerValidation();
    }
  }, [inputAmount, inputCurrency, allFiatCurrencies, setValue, triggerValidation]);
  useEffect(() => {
    const newPaymentProvider = paymentProvidersToDisplay.find(({ id }) => id === topUpProvider?.id);

    if (isDefined(newPaymentProvider) && !isEqual(newPaymentProvider, topUpProvider)) {
      switchPaymentProvider(newPaymentProvider);
    }
  }, [topUpProvider, paymentProvidersToDisplay, switchPaymentProvider]);

  const exchangeRate = useMemo(() => {
    if (isDefined(inputAmount) && inputAmount > 0 && isDefined(outputAmount) && outputAmount > 0) {
      return new BigNumber(outputAmount).div(inputAmount).decimalPlaces(6);
    }

    return undefined;
  }, [inputAmount, outputAmount]);

  const inputValueRef = useRef({ amount: inputAmount, currency: inputCurrency });
  const updateOutput = useMemo(
    () =>
      debounce(
        async (
          newInputAmount: number | undefined,
          newInputAsset: TopUpInputInterface,
          shouldSwitchBetweenProviders: boolean
        ) => {
          setValue([{ inputAmount: newInputAmount }, { inputCurrency: newInputAsset }]);
          const amounts = await updateOutputAmounts(newInputAmount, newInputAsset);
          const { amount: inputAmountFromRef, currency: currencyFromRef } = inputValueRef.current;

          if (inputAmountFromRef !== newInputAmount || currencyFromRef !== newInputAsset) {
            return;
          }

          const patchedPaymentProviders = getPaymentProvidersToDisplay(
            allPaymentProviders.map(({ id, ...rest }) => ({
              ...rest,
              id,
              outputAmount: amounts[id],
              outputSymbol: outputToken.code,
              outputPrecision: outputToken.precision
            })),
            {},
            {},
            newInputAmount
          );
          const autoselectedPaymentProvider = patchedPaymentProviders[0];

          if (shouldSwitchBetweenProviders && !isDefined(manuallySelectedProviderIdRef.current)) {
            switchPaymentProvider(autoselectedPaymentProvider);
          } else if (isDefined(newInputAmount)) {
            const patchedSameProvider = patchedPaymentProviders.find(({ id }) => id === topUpProvider?.id);
            const newPaymentProvider = patchedSameProvider ?? autoselectedPaymentProvider;
            void switchPaymentProvider(newPaymentProvider);
          }
          setIsLoading(false);
        },
        200
      ),
    [topUpProvider, updateOutputAmounts, allPaymentProviders, switchPaymentProvider, setValue]
  );
  const handleInputValueChange = useCallback(
    (newInputAmount: number | undefined, newInputAsset: TopUpInputInterface) => {
      inputValueRef.current = { amount: newInputAmount, currency: newInputAsset };
      setIsLoading(true);
      void updateOutput(newInputAmount, newInputAsset, true);
    },
    [updateOutput]
  );
  const handleInputAssetChange = useCallback(
    (newValue: TopUpInputInterface) => handleInputValueChange(inputAmount, newValue),
    [handleInputValueChange, inputAmount]
  );
  const handleInputAmountChange = useCallback(
    (newValue?: number) => handleInputValueChange(newValue, inputCurrency),
    [handleInputValueChange, inputCurrency]
  );

  const handlePaymentProviderChange = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      manuallySelectedProviderIdRef.current = newProvider?.id;
      void switchPaymentProvider(newProvider);
    },
    [switchPaymentProvider]
  );

  useInterval(
    () => {
      dispatch(loadAllCurrenciesActions.submit());
      if (!isLoading) {
        inputValueRef.current = { amount: inputAmount, currency: inputCurrency };
        setIsLoading(true);
        void updateOutput(inputAmount, inputCurrency, false);
      }
    },
    10000,
    [updateOutput, dispatch, inputAmount, inputCurrency, isLoading],
    false
  );

  const minAmount = isDefined(inputCurrency?.minAmount)
    ? toLocalFormat(inputCurrency.minAmount, { decimalPlaces: inputCurrency.precision })
    : undefined;
  const maxAmount = isDefined(inputCurrency?.maxAmount)
    ? toLocalFormat(inputCurrency.maxAmount, { decimalPlaces: inputCurrency.precision })
    : undefined;

  return (
    <PageLayout pageTitle={<T id="buyWithCard" />}>
      <div className="max-w-sm mx-auto">
        <ErrorBoundary>
          <Suspense fallback={<SpinnerSection />}>
            <form className="flex flex-col items-center gap-4 w-full" onSubmit={onSubmit}>
              <TopUpInput
                isSearchable
                label={<T id="send" />}
                amount={inputAmount}
                currency={inputCurrency}
                currenciesList={allFiatCurrencies}
                minAmount={minAmount}
                maxAmount={maxAmount}
                isMinAmountError={errors.inputAmount?.message === 'minValue'}
                isMaxAmountError={errors.inputAmount?.message === 'maxValue'}
                onCurrencySelect={handleInputAssetChange}
                onAmountChange={handleInputAmountChange}
                amountInputDisabled={false}
                fitIcons={fitFiatIconFn}
              />

              <ArrowDownIcon stroke="#4299E1" className="w-6 h-6" />

              <TopUpInput
                readOnly
                amountInputDisabled
                label={<T id="get" />}
                currency={outputToken}
                currenciesList={allCryptoCurrencies}
                amount={outputAmount}
              />

              <PaymentProviderInput
                error={shouldShowPaymentProviderError ? t('pleaseSelectPaymentProvider') : undefined}
                options={paymentProvidersToDisplay}
                isLoading={isLoading}
                onChange={handlePaymentProviderChange}
                value={topUpProvider}
              />

              <div className="w-full flex flex-col mt-2 gap-6 items-center">
                <FormSubmitButton
                  className="w-full justify-center border-none"
                  style={{
                    background: '#4299e1',
                    padding: 0
                  }}
                  disabled={false}
                  loading={isLoading}
                >
                  <T id="topUp" />
                </FormSubmitButton>

                <div className="flex justify-between w-full">
                  <span className="text-xs text-gray-30 leading-relaxed">
                    <T id="exchangeRate" />:
                  </span>
                  <span className="text-xs text-gray-600 leading-relaxed">
                    {isDefined(exchangeRate)
                      ? `1 ${inputCurrency.code} = ${toLocalFormat(exchangeRate, {})} ${outputToken.code}`
                      : '-'}
                  </span>
                </div>

                <span className="text-center text-xs text-gray-700 leading-relaxed">
                  <T id="topUpDescription" />
                </span>
              </div>
            </form>
          </Suspense>
        </ErrorBoundary>
      </div>
    </PageLayout>
  );
};
