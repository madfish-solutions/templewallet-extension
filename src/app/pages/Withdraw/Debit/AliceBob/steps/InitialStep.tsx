import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { FormSubmitButton } from 'app/atoms/FormSubmitButton';
import { useDisabledProceed } from 'app/hooks/AliceBob/useDisabledProceed';
import { useMinMaxExchangeAmounts } from 'app/hooks/AliceBob/useMinMaxExchangeAmounts';
import { useOutputEstimation } from 'app/hooks/AliceBob/useOutputEstimation';
import { ReactComponent as AlertIcon } from 'app/icons/alert.svg';
import styles from 'app/pages/Buy/Crypto/Exolix/Exolix.module.css';
import { TopUpInput } from 'app/pages/Buy/Debit/Utorg/components/TopUpInput/TopUpInput';
import { WithdrawSelectors } from 'app/pages/Withdraw/Withdraw.selectors';
import { createAliceBobOrder } from 'lib/alice-bob-api';
import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { T, t } from 'lib/i18n/react';

import { CardNumberInput } from '../components/CardNumberInput';
import { StepProps } from './step.props';

const NOT_UKRAINIAN_CARD_ERROR_MESSAGE = 'Ukrainian bank card is required.';

export const InitialStep: FC<Omit<StepProps, 'orderInfo'>> = ({ isApiError, setOrderInfo, setStep, setIsApiError }) => {
  const { analyticsState } = useAnalyticsState();

  const [inputAmount, setInputAmount] = useState<number | undefined>(undefined);

  const [isLoading, setLoading] = useState(false);

  const cardNumberRef = useRef<HTMLInputElement>(null);

  const [cardInputError, setCardInputError] = useState('');
  const [isNotUkrainianCardError, setIsNotUkrainianCardError] = useState(false);

  const { minExchangeAmount, maxExchangeAmount, isMinMaxLoading } = useMinMaxExchangeAmounts(setIsApiError, true);

  const { isMinAmountError, isMaxAmountError, isInsufficientTezBalanceError, disabledProceed } = useDisabledProceed(
    inputAmount,
    minExchangeAmount,
    maxExchangeAmount,
    isApiError,
    Boolean(cardInputError),
    isNotUkrainianCardError,
    true
  );

  const outputAmount = useOutputEstimation(
    inputAmount,
    isMinAmountError,
    isMaxAmountError,
    setLoading,
    setIsApiError,
    true
  );

  const exchangeRate = useMemo(
    () =>
      inputAmount && inputAmount > 0
        ? new BigNumber(outputAmount).div(inputAmount).dp(2, BigNumber.ROUND_FLOOR).toString()
        : 0,
    [inputAmount, outputAmount]
  );

  const handleSubmit = () => {
    const cardNumber = cardNumberRef.current?.value;

    if (!cardNumber) {
      setCardInputError(t('required'));
      return;
    }

    if (!disabledProceed) {
      setLoading(true);
      createAliceBobOrder({
        isWithdraw: 'true',
        amount: inputAmount?.toString() ?? '0',
        userId: analyticsState.userId,
        cardNumber
      })
        .then(({ orderInfo }) => {
          setOrderInfo(orderInfo);
          setStep(1);
        })
        .catch(err => {
          if (err.response.data.message === NOT_UKRAINIAN_CARD_ERROR_MESSAGE) {
            setIsNotUkrainianCardError(true);
          } else {
            setIsApiError(true);
          }
        })
        .finally(() => setLoading(false));
    }
  };

  const handleInputAmountChange = useCallback((amount?: number) => setInputAmount(amount), []);

  return (
    <>
      <p className={styles['title']}>
        <T id={'sellTezDetails'} />
      </p>
      <p className={styles['description']}>
        <T id={'sellDetailsDescription'} />
      </p>

      <div className="mx-auto mt-10 text-center font-inter font-normal text-gray-700">
        <TopUpInput
          singleToken
          isDefaultUahIcon
          amountInputDisabled={isMinMaxLoading}
          amount={inputAmount}
          label={<T id="send" />}
          currencyName="TEZ"
          currenciesList={[]}
          minAmount={minExchangeAmount.toString()}
          maxAmount={maxExchangeAmount.toString()}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          isInsufficientTezBalanceError={isInsufficientTezBalanceError}
          onAmountChange={handleInputAmountChange}
          className="mb-4"
        />

        <br />
        <TopUpInput
          readOnly
          singleToken
          isDefaultUahIcon
          amountInputDisabled
          label={<T id="get" />}
          currencyName="UAH"
          currenciesList={[]}
          amount={outputAmount}
        />

        <div className={classNames(styles['exchangeRateBlock'], 'mt-1 mb-10')}>
          <p className={classNames(styles['exchangeTitle'])}>
            <T id={'exchangeRate'} />:
          </p>
          <p className={styles['exchangeData']}>1 TEZ ≈ {exchangeRate} UAH</p>
        </div>

        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900">
            <T id="toCard" />
          </span>
          <span
            className={classNames(
              'inline-flex items-center font-inter text-xs font-normal',
              isNotUkrainianCardError ? 'text-red-700' : 'text-orange-500'
            )}
          >
            <AlertIcon className="mr-1 stroke-current" />
            <T id="onlyForUkrainianCards" />
          </span>
        </div>

        <CardNumberInput
          ref={cardNumberRef}
          error={cardInputError}
          setError={setCardInputError}
          setIsNotUkrainianCardError={setIsNotUkrainianCardError}
          className={classNames(isNotUkrainianCardError && 'border-red-700')}
        />

        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem'
          }}
          disabled={disabledProceed}
          loading={isLoading || isMinMaxLoading}
          testID={WithdrawSelectors.AliceBobNextButton}
          onClick={handleSubmit}
        >
          <T id="next" />
        </FormSubmitButton>
      </div>
    </>
  );
};
