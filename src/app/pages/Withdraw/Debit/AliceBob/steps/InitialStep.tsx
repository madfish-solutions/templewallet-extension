import React, { memo, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { FormSubmitButton } from 'app/atoms/FormSubmitButton';
import { useDisabledProceed } from 'app/hooks/AliceBob/use-disabled-proceed';
import {
  AliceBobWithdrawCurrency,
  DEFAULT_OUTPUT_CURRENCY,
  useOutputCurrencies
} from 'app/hooks/AliceBob/use-output-currencies';
import { useOutputEstimation } from 'app/hooks/AliceBob/use-output-estimation';
import { ReactComponent as AlertIcon } from 'app/icons/alert.svg';
import styles from 'app/pages/Buy/Crypto/Exolix/Exolix.module.css';
import { WithdrawSelectors } from 'app/pages/Withdraw/Withdraw.selectors';
import { useUserIdSelector } from 'app/store/settings/selectors';
import { TopUpInput } from 'app/templates/TopUpInput';
import { createAliceBobOrder } from 'lib/apis/temple';
import { t, T } from 'lib/i18n/react';
import { TezosNetworkEssentials } from 'temple/networks';

import { CardNumberInput } from '../components/CardNumberInput';
import { useCardNumberInput } from '../components/use-card-number-input.hook';

import { StepProps } from './step.props';

const NOT_UKRAINIAN_CARD_ERROR_MESSAGE = 'Ukrainian bank card is required.';

interface Props extends Omit<StepProps, 'orderInfo'> {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
}

export const InitialStep = memo<Props>(
  ({ network, publicKeyHash, isApiError, setOrderInfo, setStep, setIsApiError }) => {
    const userId = useUserIdSelector();

    const [orderIsProcessing, setOrderIsProcessing] = useState(false);
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);

    const [inputAmount, setInputAmount] = useState<number>();
    const [outputCurrency, setOutputCurrency] = useState<AliceBobWithdrawCurrency>(DEFAULT_OUTPUT_CURRENCY);

    const cardNumberInput = useCardNumberInput(isFormSubmitted);

    const { currencies, isCurrenciesLoading } = useOutputCurrencies(setIsApiError, outputCurrency, setOutputCurrency);

    const { tezBalanceLoading, isMinAmountError, isMaxAmountError, isInsufficientTezBalanceError, disabledProceed } =
      useDisabledProceed(
        network,
        publicKeyHash,
        inputAmount,
        outputCurrency?.minAmount,
        outputCurrency?.maxAmount,
        true
      );

    const isFormValid = useMemo(
      () => !disabledProceed && !isApiError && cardNumberInput.isValid && cardNumberInput.isTouched,
      [disabledProceed, isApiError, cardNumberInput.isValid, cardNumberInput.isTouched]
    );

    const { estimationIsLoading, outputAmount } = useOutputEstimation(
      inputAmount,
      outputCurrency.code,
      isMinAmountError,
      isMaxAmountError,
      setIsApiError
    );

    const exchangeRate = useMemo(
      () =>
        inputAmount && inputAmount > 0
          ? new BigNumber(outputAmount).div(inputAmount).dp(2, BigNumber.ROUND_FLOOR).toString()
          : 0,
      [inputAmount, outputAmount]
    );

    const handleSubmit = () => {
      setIsFormSubmitted(true);

      if (!isFormValid || !outputCurrency?.code || !inputAmount) {
        return;
      }

      setOrderIsProcessing(true);

      createAliceBobOrder(
        inputAmount?.toString(),
        'XTZ',
        outputCurrency?.code,
        userId,
        undefined,
        cardNumberInput.value
      )
        .then(response => {
          setOrderInfo(response.data.orderInfo);
          setStep(1);
        })
        .catch(err => {
          if (err.response.data.message === NOT_UKRAINIAN_CARD_ERROR_MESSAGE) {
            cardNumberInput.setCustomError(t('onlyForCountryBankingCards', 'Ukrainian'));
          } else {
            setIsApiError(true);
          }
        })
        .finally(() => setOrderIsProcessing(false));
    };

    const handleInputAmountChange = (amount?: number) => setInputAmount(amount);

    const isLoading = tezBalanceLoading || orderIsProcessing || estimationIsLoading || isCurrenciesLoading;

    return (
      <>
        <p className={styles['title']}>
          <T id="sellTezDetails" />
        </p>
        <p className={styles['description']}>
          <T id="sellDetailsDescription" />
        </p>

        <div className="mx-auto mt-10 text-center font-inter font-normal text-gray-700">
          <TopUpInput
            amountInputDisabled={isCurrenciesLoading}
            amount={inputAmount}
            label={<T id="send" />}
            currency={{ code: 'TEZ' }}
            currenciesList={[{ code: 'TEZ' }]}
            minAmount={String(outputCurrency?.minAmount ?? '0')}
            maxAmount={String(outputCurrency?.maxAmount ?? '0')}
            isMinAmountError={isMinAmountError}
            isMaxAmountError={isMaxAmountError}
            isInsufficientTezBalanceError={isInsufficientTezBalanceError}
            emptyListPlaceholder={t('noAssetsFound')}
            onAmountChange={handleInputAmountChange}
            className="mb-4"
          />

          <br />
          <TopUpInput
            isFiat
            readOnly
            amountInputDisabled
            label={<T id="get" />}
            currency={outputCurrency}
            currenciesList={currencies}
            isCurrenciesLoading={isCurrenciesLoading}
            amount={outputAmount}
            emptyListPlaceholder={t('noAssetsFound')}
            onCurrencySelect={currency => setOutputCurrency(currency)}
          />

          <div className={clsx(styles['exchangeRateBlock'], 'mt-1 mb-10')}>
            <p className={styles['exchangeTitle']}>
              <T id={'exchangeRate'} />:
            </p>
            <p className={styles['exchangeData']}>
              {exchangeRate ? `1 TEZ ≈ ${exchangeRate} ${outputCurrency?.code}` : '-'}
            </p>
          </div>

          <div className="w-full flex mb-1 items-center justify-between">
            <span className="text-xl text-gray-900">
              <T id="toCard" />
            </span>
            <span className="inline-flex items-center font-inter text-font-description font-normal text-orange-500">
              <AlertIcon className="mr-1 stroke-current" />
              <T id="onlyForCountryBankingCards" substitutions={[outputCurrency.name.split(' ')[0]]} />
            </span>
          </div>

          <CardNumberInput
            value={cardNumberInput.value}
            error={cardNumberInput.error}
            isFocused={cardNumberInput.isFocused}
            onBlur={cardNumberInput.onBlur}
            onFocus={cardNumberInput.onFocus}
            onChange={cardNumberInput.onChange}
          />

          <FormSubmitButton
            className="w-full justify-center border-none mt-6"
            style={{
              background: '#4299e1',
              paddingTop: '0.625rem',
              paddingBottom: '0.625rem'
            }}
            loading={isLoading}
            testID={WithdrawSelectors.aliceBobNextButton}
            onClick={handleSubmit}
          >
            <T id="next" />
          </FormSubmitButton>
        </div>
      </>
    );
  }
);
