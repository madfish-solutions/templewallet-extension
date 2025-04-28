import React, { FC, Suspense, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import { Alert, FormSubmitButton } from 'app/atoms';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ArrowDownIcon } from 'app/icons/arrow-down.svg';
import PageLayout from 'app/layouts/PageLayout';
import { loadAllCurrenciesActions, updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { PaymentProviderInput } from 'app/templates/PaymentProviderInput';
import { SpinnerSection } from 'app/templates/SendForm/SpinnerSection';
import { TopUpInput } from 'app/templates/TopUpInput';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { shouldShowFieldError } from 'lib/form/should-show-field-error';
import { t, T, toLocalFormat } from 'lib/i18n';
import { useInterval } from 'lib/ui/hooks';

import { BuyWithCreditCardSelectors } from './BuyWithCreditCard.selectors';
import { useAllCryptoCurrencies } from './hooks/use-all-crypto-currencies';
import { useAllFiatCurrencies } from './hooks/use-all-fiat-currencies';
import { useBuyWithCreditCardForm } from './hooks/use-buy-with-credit-card-form';
import { useErrorAlert } from './hooks/use-error-alert';
import { useFormInputsCallbacks } from './hooks/use-form-inputs-callbacks';
import { usePairLimitsAreLoading } from './hooks/use-input-limits';
import { usePaymentProviders } from './hooks/use-payment-providers';
import { useUpdateCurrentProvider } from './hooks/use-update-current-provider';
import { AmountErrorType } from './types/amount-error-type';

const FORM_REFRESH_INTERVAL = 20000;

const fitFiatIconFn = (currency: TopUpInputInterface) => !currency.icon.startsWith(MOONPAY_ASSETS_BASE_URL);

export const BuyWithCreditCard: FC = () => {
  const dispatch = useDispatch();
  const [formIsLoading, setFormIsLoading] = useState(false);
  const form = useBuyWithCreditCardForm();
  const {
    formValues,
    errors,
    lazySetValue,
    triggerValidation,
    formState,
    handleSubmit,
    onSubmit,
    purchaseLinkError,
    purchaseLinkLoading
  } = form;
  const { inputAmount, inputCurrency, outputToken, outputAmount, topUpProvider } = formValues;

  const { allPaymentProviders, paymentProvidersToDisplay, providersErrors, updateOutputAmounts } = usePaymentProviders(
    inputAmount,
    inputCurrency,
    outputToken
  );

  const {
    handleInputAssetChange,
    handleInputAmountChange,
    handleOutputTokenChange,
    handlePaymentProviderChange,
    setPaymentProvider,
    manuallySelectedProviderIdRef,
    refreshForm
  } = useFormInputsCallbacks(form, updateOutputAmounts, formIsLoading, setFormIsLoading);

  const {
    onAlertClose,
    shouldHideErrorAlert,
    message: alertErrorMessage
  } = useErrorAlert(form, allPaymentProviders, providersErrors, purchaseLinkError);

  const { fiatCurrenciesWithPairLimits: allFiatCurrencies } = useAllFiatCurrencies(
    inputCurrency.code,
    outputToken.code
  );
  const allCryptoCurrencies = useAllCryptoCurrencies();
  const currenciesLoading = useCurrenciesLoadingSelector();
  const pairLimitsLoading = usePairLimitsAreLoading(inputCurrency.code, outputToken.code);

  const inputAmountErrorMessage = errors.inputAmount?.message;
  const shouldShowInputAmountError = shouldShowFieldError('inputAmount', formState);
  const isMinAmountError =
    shouldShowInputAmountError && isDefined(inputAmountErrorMessage) && inputAmountErrorMessage !== AmountErrorType.Max;
  const isMaxAmountError = shouldShowInputAmountError && inputAmountErrorMessage === AmountErrorType.Max;
  const shouldShowPaymentProviderError =
    isDefined(errors.topUpProvider) &&
    shouldShowFieldError('topUpProvider', formState) &&
    paymentProvidersToDisplay.length > 0;

  useEffect(() => void dispatch(loadAllCurrenciesActions.submit()), []);

  useEffect(() => {
    dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSymbol: outputToken.code }));
  }, [dispatch, inputCurrency.code, outputToken.code, allFiatCurrencies.length, allCryptoCurrencies.length]);

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

  const exchangeRate = useMemo(() => {
    if (isDefined(inputAmount) && inputAmount > 0 && isDefined(outputAmount) && outputAmount > 0) {
      return new BigNumber(outputAmount).div(inputAmount).decimalPlaces(6);
    }

    return undefined;
  }, [inputAmount, outputAmount]);

  const isLoading = formIsLoading || currenciesLoading || pairLimitsLoading || purchaseLinkLoading;

  useUpdateCurrentProvider(
    paymentProvidersToDisplay,
    topUpProvider,
    manuallySelectedProviderIdRef,
    setPaymentProvider,
    isLoading
  );

  useInterval(refreshForm, FORM_REFRESH_INTERVAL, [refreshForm], false);

  const minAmountStr = useMemo(
    () =>
      isDefined(inputCurrency?.minAmount)
        ? toLocalFormat(inputCurrency.minAmount, { decimalPlaces: inputCurrency.precision })
        : undefined,
    [inputCurrency]
  );
  const maxAmountStr = useMemo(
    () =>
      isDefined(inputCurrency?.maxAmount)
        ? toLocalFormat(inputCurrency.maxAmount, { decimalPlaces: inputCurrency.precision })
        : undefined,
    [inputCurrency]
  );

  const someErrorOccurred = isDefined(purchaseLinkError) || Object.keys(errors).length > 0;
  const submitDisabled = someErrorOccurred || !isDefined(outputAmount);

  return (
    <PageLayout pageTitle={<T id="buyWithCard" />}>
      <div className="max-w-sm mx-auto">
        <ErrorBoundary>
          <Suspense fallback={<SpinnerSection />}>
            <div className="flex flex-col items-center gap-4 w-full">
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
                isFiat
                isSearchable
                label={<T id="send" />}
                amount={inputAmount}
                currency={inputCurrency}
                currenciesList={allFiatCurrencies}
                decimals={inputCurrency.precision}
                isCurrenciesLoading={currenciesLoading}
                minAmount={minAmountStr}
                maxAmount={maxAmountStr}
                isMinAmountError={isMinAmountError}
                isMaxAmountError={isMaxAmountError}
                amountInputDisabled={false}
                fitIcons={fitFiatIconFn}
                emptyListPlaceholder={t('currencyNotFound')}
                onCurrencySelect={handleInputAssetChange}
                onAmountChange={handleInputAmountChange}
                testID={BuyWithCreditCardSelectors.sendInput}
              />

              <ArrowDownIcon stroke="#4299E1" className="w-6 h-6" />

              <TopUpInput
                readOnly
                amountInputDisabled
                label={<T id="get" />}
                currency={outputToken}
                currenciesList={allCryptoCurrencies}
                isCurrenciesLoading={currenciesLoading}
                onCurrencySelect={handleOutputTokenChange}
                amount={outputAmount}
                testID={BuyWithCreditCardSelectors.getInput}
              />

              <PaymentProviderInput
                error={shouldShowPaymentProviderError ? t('pleaseSelectPaymentProvider') : undefined}
                headerTestID={BuyWithCreditCardSelectors.paymentProviderDropdownHeader}
                options={paymentProvidersToDisplay}
                isLoading={formIsLoading}
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
                  disabled={submitDisabled}
                  loading={isLoading}
                  testID={BuyWithCreditCardSelectors.topUpButton}
                  onClick={handleSubmit(onSubmit)}
                >
                  <span>
                    <T id="topUp" />
                  </span>
                </FormSubmitButton>

                <div className="flex justify-between w-full">
                  <span className="text-xs text-gray-30 leading-relaxed">
                    <T id="exchangeRate" />:
                  </span>
                  <span className="text-xs text-gray-600 leading-relaxed">
                    {isDefined(exchangeRate)
                      ? `1 ${getAssetSymbolToDisplay(inputCurrency)} = ${toLocalFormat(
                          exchangeRate,
                          {}
                        )} ${getAssetSymbolToDisplay(outputToken)}`
                      : '-'}
                  </span>
                </div>

                <span className="text-center text-xs text-gray-700 leading-relaxed">
                  <T id="topUpDescription" />
                </span>
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      </div>
    </PageLayout>
  );
};
