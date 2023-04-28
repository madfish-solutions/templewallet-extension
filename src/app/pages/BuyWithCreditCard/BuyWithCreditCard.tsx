import React, { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import debounce from 'debounce-promise';
import isEqual from 'lodash.isequal';
import { useDispatch } from 'react-redux';

import { Alert, FormSubmitButton } from 'app/atoms';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ArrowDownIcon } from 'app/icons/arrow-down.svg';
import PageLayout from 'app/layouts/PageLayout';
import { loadAllCurrenciesActions, updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { PaymentProviderInput } from 'app/templates/PaymentProviderInput';
import { SpinnerSection } from 'app/templates/SendForm/SpinnerSection';
import { TopUpInput } from 'app/templates/TopUpInput';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';
import { shouldShowFieldError } from 'lib/form/should-show-field-error';
import { t, T, toLocalFormat } from 'lib/i18n';
import { useInterval } from 'lib/ui/hooks';
import { isDefined } from 'lib/utils/is-defined';

import { BuyWithCreditCardSelectors } from './BuyWithCreditCard.selectors';
import { useAllCryptoCurrencies } from './hooks/use-all-crypto-currencies';
import { useAllFiatCurrencies } from './hooks/use-all-fiat-currencies';
import { useBuyWithCreditCardForm } from './hooks/use-buy-with-credit-card-form';
import { useErrorAlert } from './hooks/use-error-alert';
import { usePaymentProviders } from './hooks/use-payment-providers';
import { AmountErrorType } from './types/amount-error-type';

const fitFiatIconFn = (currency: TopUpInputInterface) => !currency.icon.startsWith(MOONPAY_ASSETS_BASE_URL);

export const BuyWithCreditCard: FC = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const form = useBuyWithCreditCardForm();
  const { formValues, onSubmit, errors, lazySetValue, triggerValidation, formState, getValues } = form;
  const { inputAmount, inputCurrency, outputToken, outputAmount, topUpProvider } = formValues;
  const manuallySelectedProviderIdRef = useRef<TopUpProviderId>();
  const { allPaymentProviders, amountsUpdateErrors, paymentProvidersToDisplay, updateOutputAmounts } =
    usePaymentProviders(inputAmount, inputCurrency, outputToken);
  const {
    onAlertClose,
    shouldHideErrorAlert,
    message: alertErrorMessage
  } = useErrorAlert(form, allPaymentProviders, amountsUpdateErrors);
  const allFiatCurrencies = useAllFiatCurrencies(inputCurrency.code, outputToken.code);
  const allCryptoCurrencies = useAllCryptoCurrencies();

  const inputAmountErrorMessage = errors.inputAmount?.message;
  const shouldShowInputAmountError = shouldShowFieldError('inputAmount', formState);
  const isMinAmountError =
    shouldShowInputAmountError && inputAmountErrorMessage !== AmountErrorType.Max && isDefined(inputAmountErrorMessage);
  const isMaxAmountError = shouldShowInputAmountError && inputAmountErrorMessage === AmountErrorType.Max;
  const shouldShowPaymentProviderError =
    isDefined(errors.topUpProvider) &&
    shouldShowFieldError('topUpProvider', formState) &&
    paymentProvidersToDisplay.length > 0;

  const switchPaymentProvider = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      const newOutputAmount = newProvider?.outputAmount;
      lazySetValue({ topUpProvider: newProvider, outputAmount: newOutputAmount });
      triggerValidation();
    },
    [lazySetValue, allPaymentProviders, triggerValidation]
  );

  useEffect(() => {
    const { outputToken } = getValues();
    dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSymbol: outputToken.code }));
  }, [dispatch, inputCurrency, getValues]);
  useEffect(() => void dispatch(loadAllCurrenciesActions.submit()), []);

  useEffect(() => {
    const newInputAsset = allFiatCurrencies.find(({ code }) => code === inputCurrency.code);

    if (isDefined(newInputAsset) && !isEqual(newInputAsset, inputCurrency)) {
      lazySetValue({
        inputCurrency: newInputAsset,
        inputAmount:
          isDefined(newInputAsset.precision) && isDefined(inputAmount)
            ? new BigNumber(inputAmount).decimalPlaces(newInputAsset.precision).toNumber()
            : inputAmount
      });
      triggerValidation();
    }
  }, [inputAmount, inputCurrency, allFiatCurrencies, lazySetValue, triggerValidation]);
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

  const outputCalculationDataRef = useRef({ inputAmount, inputCurrency, outputToken });
  const updateOutput = useMemo(
    () =>
      debounce(
        async (
          newInputAmount: number | undefined,
          newInputAsset: TopUpInputInterface,
          newOutputAsset: TopUpOutputInterface,
          shouldSwitchBetweenProviders: boolean
        ) => {
          const outputCalculationData = {
            inputAmount: newInputAmount,
            inputCurrency: newInputAsset,
            outputToken: newOutputAsset
          };
          const correctedNewInputAmount = isDefined(newInputAmount)
            ? new BigNumber(newInputAmount).decimalPlaces(newInputAsset.precision).toNumber()
            : undefined;
          lazySetValue({
            inputAmount: correctedNewInputAmount,
            inputCurrency: newInputAsset,
            outputToken: newOutputAsset
          });
          const amounts = await updateOutputAmounts(correctedNewInputAmount, newInputAsset, newOutputAsset);

          if (!isEqual(outputCalculationData, outputCalculationDataRef.current)) {
            return;
          }

          const patchedPaymentProviders = getPaymentProvidersToDisplay(
            allPaymentProviders.map(({ id, ...rest }) => ({
              ...rest,
              id,
              inputSymbol: newInputAsset.code,
              inputPrecision: newInputAsset.precision,
              minInputAmount: newInputAsset.minAmount,
              maxInputAmount: newInputAsset.maxAmount,
              outputAmount: amounts[id],
              outputSymbol: outputToken.code,
              outputPrecision: outputToken.precision
            })),
            {},
            {},
            correctedNewInputAmount
          );
          const autoselectedPaymentProvider = patchedPaymentProviders[0];

          if (shouldSwitchBetweenProviders && !isDefined(manuallySelectedProviderIdRef.current)) {
            switchPaymentProvider(autoselectedPaymentProvider);
          } else if (isDefined(correctedNewInputAmount)) {
            const patchedSameProvider = patchedPaymentProviders.find(({ id }) => id === topUpProvider?.id);
            const newPaymentProvider = patchedSameProvider ?? autoselectedPaymentProvider;
            void switchPaymentProvider(newPaymentProvider);
          }
          setIsLoading(false);
        },
        200
      ),
    [topUpProvider, updateOutputAmounts, allPaymentProviders, switchPaymentProvider, lazySetValue]
  );
  const handleInputValueChange = useCallback(
    (newInputAmount: number | undefined, newInputAsset: TopUpInputInterface) => {
      outputCalculationDataRef.current = { inputAmount: newInputAmount, inputCurrency: newInputAsset, outputToken };
      setIsLoading(true);
      void updateOutput(newInputAmount, newInputAsset, outputToken, true);
    },
    [updateOutput, outputToken]
  );
  const handleInputAssetChange = useCallback(
    (newValue: TopUpInputInterface) => handleInputValueChange(inputAmount, newValue),
    [handleInputValueChange, inputAmount]
  );
  const handleInputAmountChange = useCallback(
    (newValue?: number) => handleInputValueChange(newValue, inputCurrency),
    [handleInputValueChange, inputCurrency]
  );
  const handleOutputTokenChange = useCallback(
    (newValue: TopUpOutputInterface) => {
      outputCalculationDataRef.current = { inputAmount, inputCurrency, outputToken: newValue };
      setIsLoading(true);
      void updateOutput(inputAmount, inputCurrency, newValue, true);
    },
    [inputAmount, inputCurrency, updateOutput]
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
      dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSymbol: outputToken.code }));
      if (!isLoading) {
        outputCalculationDataRef.current = { inputAmount, inputCurrency, outputToken };
        setIsLoading(true);
        void updateOutput(inputAmount, inputCurrency, outputToken, false);
      }
    },
    10000,
    [updateOutput, dispatch, inputAmount, inputCurrency, outputToken, isLoading],
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
              {isDefined(alertErrorMessage) && !shouldHideErrorAlert && (
                <Alert
                  type="error"
                  title={<T id="error" />}
                  description={alertErrorMessage}
                  closable={true}
                  onClose={onAlertClose}
                />
              )}

              <TopUpInput
                isSearchable
                label={<T id="send" />}
                amount={inputAmount}
                currency={inputCurrency}
                currenciesList={allFiatCurrencies}
                decimals={inputCurrency.precision}
                minAmount={minAmount}
                maxAmount={maxAmount}
                isMinAmountError={isMinAmountError}
                isMaxAmountError={isMaxAmountError}
                onCurrencySelect={handleInputAssetChange}
                onAmountChange={handleInputAmountChange}
                amountInputDisabled={false}
                fitIcons={fitFiatIconFn}
                testID={BuyWithCreditCardSelectors.sendInput}
              />

              <ArrowDownIcon stroke="#4299E1" className="w-6 h-6" />

              <TopUpInput
                readOnly
                amountInputDisabled
                label={<T id="get" />}
                currency={outputToken}
                currenciesList={allCryptoCurrencies}
                onCurrencySelect={handleOutputTokenChange}
                amount={outputAmount}
                testID={BuyWithCreditCardSelectors.getInput}
              />

              <PaymentProviderInput
                error={shouldShowPaymentProviderError ? t('pleaseSelectPaymentProvider') : undefined}
                headerTestID={BuyWithCreditCardSelectors.paymentProviderDropdownHeader}
                options={paymentProvidersToDisplay}
                isLoading={isLoading}
                onChange={handlePaymentProviderChange}
                value={topUpProvider}
                testID={BuyWithCreditCardSelectors.paymentProviderDropdown}
              />

              <div className="w-full flex flex-col mt-2 gap-6 items-center">
                <FormSubmitButton
                  className="w-full justify-center border-none"
                  style={{
                    background: '#4299e1',
                    padding: 0
                  }}
                  disabled={Object.keys(errors).length > 0}
                  loading={isLoading}
                  testID={BuyWithCreditCardSelectors.topUpButton}
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
