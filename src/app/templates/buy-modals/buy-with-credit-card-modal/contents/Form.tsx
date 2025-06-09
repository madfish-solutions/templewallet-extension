import React, { FC, MutableRefObject, useCallback, useEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import { isEmpty, isEqual } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form-v7';

import { FadeTransition } from 'app/a11y/FadeTransition';
import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { dispatch } from 'app/store';
import { updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { InfoContainer, InfoRaw } from 'app/templates/buy-modals/info-block';
import { ErrorType, MinMaxDisplay } from 'app/templates/buy-modals/min-max-display';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { ProviderErrors } from 'lib/buy-with-credit-card/types';
import { T, t } from 'lib/i18n';

import { NewQuoteLabel } from '../components/NewQuoteLabel';
import { SelectAssetButton } from '../components/SelectAssetButton';
import { SelectProviderButton } from '../components/SelectProviderButton';
import { VALUE_PLACEHOLDER } from '../config';
import { BuyWithCreditCardFormData } from '../form-data.interface';
import { useAllCryptoCurrencies } from '../hooks/use-all-crypto-currencies';
import { useAllFiatCurrencies } from '../hooks/use-all-fiat-currencies';
import { useBuyWithCreditCardFormSubmit } from '../hooks/use-buy-with-credit-card-form-submit';
import { usePairLimitsAreLoading } from '../hooks/use-input-limits';
import { useUpdateCurrentProvider } from '../hooks/use-update-current-provider';
import { BuyWithCreditCardSelectors } from '../selectors';

interface Props {
  setModalContent: SyncFn<'send' | 'get' | 'provider'>;
  formIsLoading: boolean;
  allPaymentProviders: PaymentProviderInterface[];
  paymentProvidersToDisplay: PaymentProviderInterface[];
  providersErrors: Record<TopUpProviderId, ProviderErrors>;
  lastFormRefreshTimestamp: number;
  setPaymentProvider: SyncFn<PaymentProviderInterface | undefined>;
  manuallySelectedProviderIdRef: MutableRefObject<TopUpProviderId | undefined>;
  onInputAmountChange: SyncFn<number | undefined>;
}

export const Form: FC<Props> = ({
  setModalContent,
  formIsLoading,
  paymentProvidersToDisplay,
  manuallySelectedProviderIdRef,
  lastFormRefreshTimestamp,
  setPaymentProvider,
  onInputAmountChange
}) => {
  const { control, watch, handleSubmit, formState, setValue } = useFormContext<BuyWithCreditCardFormData>();
  const { isSubmitting, submitCount, errors } = formState;

  const formSubmitted = submitCount > 0;

  const inputAmount = watch('inputAmount');
  const outputAmount = watch('outputAmount');
  const inputCurrency = watch('inputCurrency');
  const outputToken = watch('outputToken');
  const provider = watch('provider');

  const currenciesLoading = useCurrenciesLoadingSelector();
  const pairLimitsLoading = usePairLimitsAreLoading(inputCurrency.code, outputToken.slug);

  const { onSubmit, purchaseLinkLoading } = useBuyWithCreditCardFormSubmit();

  const exchangeRate = useMemo(() => {
    if (isDefined(inputAmount) && inputAmount > 0 && isDefined(outputAmount) && outputAmount > 0) {
      return new BigNumber(outputAmount).div(inputAmount).decimalPlaces(18);
    }

    return undefined;
  }, [inputAmount, outputAmount]);

  const isLoading = isSubmitting || formIsLoading || currenciesLoading || pairLimitsLoading || purchaseLinkLoading;

  useUpdateCurrentProvider(
    paymentProvidersToDisplay,
    provider,
    manuallySelectedProviderIdRef,
    setPaymentProvider,
    isLoading
  );

  const allFiatCurrencies = useAllFiatCurrencies(inputCurrency.code, outputToken.slug);
  const allCryptoCurrencies = useAllCryptoCurrencies();

  useEffect(() => {
    dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSlug: outputToken.slug }));
  }, [inputCurrency.code, outputToken.slug, allFiatCurrencies.length, allCryptoCurrencies.length]);

  useEffect(() => {
    const newInputAsset = allFiatCurrencies.find(({ code }) => code === inputCurrency.code);

    if (isDefined(newInputAsset) && !isEqual(newInputAsset, inputCurrency)) {
      setValue('inputCurrency', newInputAsset);

      if (isDefined(newInputAsset.precision) && isDefined(inputAmount)) {
        setValue('inputAmount', new BigNumber(inputAmount).decimalPlaces(newInputAsset.precision).toNumber(), {
          shouldValidate: true
        });
      }
    }
  }, [allFiatCurrencies, inputAmount, inputCurrency, setValue]);

  const handleSelectCurrency = useCallback(() => void setModalContent('send'), [setModalContent]);
  const handleSelectToken = useCallback(() => void setModalContent('get'), [setModalContent]);
  const handleSelectProvider = useCallback(() => void setModalContent('provider'), [setModalContent]);

  const handleMinClick = useCallback(
    () => void onInputAmountChange(inputCurrency.minAmount),
    [inputCurrency.minAmount, onInputAmountChange]
  );

  const handleMaxClick = useCallback(
    () => void onInputAmountChange(inputCurrency.maxAmount),
    [inputCurrency.maxAmount, onInputAmountChange]
  );

  const validateInputValue = useCallback(
    (value?: number) => {
      const { minAmount, maxAmount } = inputCurrency;

      if (!value || !minAmount || !maxAmount) return ErrorType.min;

      if (value < minAmount) return ErrorType.min;
      if (value > maxAmount) return ErrorType.max;

      return true;
    },
    [inputCurrency]
  );

  return (
    <FadeTransition>
      <form id="main-form" className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="inputAmount"
          control={control}
          rules={{ validate: validateInputValue }}
          render={({ field: { value, onBlur }, formState: { errors } }) => (
            <AssetField
              value={value}
              onBlur={onBlur}
              onChange={v => onInputAmountChange(v ? Number(v) : undefined)}
              assetDecimals={inputCurrency.precision}
              rightSideComponent={
                <SelectAssetButton useFlagIcon currency={inputCurrency} onClick={handleSelectCurrency} />
              }
              rightSideContainerStyle={{ right: 2 }}
              style={{ paddingRight: 158 }}
              underneathComponent={
                <MinMaxDisplay
                  currencyCode={getAssetSymbolToDisplay(inputCurrency)}
                  min={inputCurrency?.minAmount}
                  max={inputCurrency?.maxAmount}
                  error={errors.inputAmount}
                  onMinClick={handleMinClick}
                  onMaxClick={handleMaxClick}
                />
              }
              label={t('send')}
              placeholder="0.00"
              containerClassName="pb-6"
              testID={BuyWithCreditCardSelectors.sendInput}
            />
          )}
        />

        <AssetField
          readOnly
          value={outputAmount}
          assetDecimals={outputToken.precision}
          rightSideComponent={<SelectAssetButton currency={outputToken} onClick={handleSelectToken} />}
          rightSideContainerStyle={{ right: 2 }}
          style={{ paddingRight: 158 }}
          label={t('get')}
          placeholder="0.00"
          shouldShowErrorCaption={false}
          containerClassName="pb-8"
          testID={BuyWithCreditCardSelectors.getInput}
        />

        <NewQuoteLabel title="provider" lastFormRefreshTimestamp={lastFormRefreshTimestamp} className="mb-1" />

        <SelectProviderButton provider={provider} onClick={handleSelectProvider} />

        <InfoContainer className="mt-6 mb-8">
          <InfoRaw bottomSeparator title="exchangeRate">
            <span className="p-1 text-font-description">
              {exchangeRate ? (
                <>
                  {'1 ' + getAssetSymbolToDisplay(inputCurrency) + ' ≈ '}
                  <Money smallFractionFont={false}>{exchangeRate}</Money> {getAssetSymbolToDisplay(outputToken)}
                </>
              ) : (
                VALUE_PLACEHOLDER
              )}
            </span>
          </InfoRaw>

          <p className="py-2 px-1 text-font-small text-grey-1">
            <T id="warningTopUpServiceMessage" />
          </p>
        </InfoContainer>
      </form>

      <ActionsButtonsBox>
        <StyledButton
          type="submit"
          form="main-form"
          size="L"
          color="primary"
          loading={isLoading}
          disabled={formSubmitted && (!outputAmount || !isEmpty(errors))}
          testID={BuyWithCreditCardSelectors.topUpButton}
        >
          <T id="topUp" />
        </StyledButton>
      </ActionsButtonsBox>
    </FadeTransition>
  );
};
