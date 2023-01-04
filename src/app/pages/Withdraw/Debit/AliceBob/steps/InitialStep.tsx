import React, { FC, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { FormSubmitButton } from 'app/atoms/FormSubmitButton';
import { useDisabledProceed } from 'app/hooks/AliceBob/useDisabledProceed';
import { useMinMaxExchangeAmounts } from 'app/hooks/AliceBob/useMinMaxExchangeAmounts';
import { useOutputEstimation } from 'app/hooks/AliceBob/useOutputEstimation';
import { ReactComponent as AlertIcon } from 'app/icons/alert.svg';
import styles from 'app/pages/Buy/Crypto/Exolix/Exolix.module.css';
import { WithdrawSelectors } from 'app/pages/Withdraw/Withdraw.selectors';
import { TopUpInput } from 'app/templates/TopUpInput';
import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { createAliceBobOrder } from 'lib/apis/temple';
import { t, T } from 'lib/i18n/react';
import { FIAT_ICONS_SRC } from 'lib/icons';

import { CardNumberInput } from '../components/CardNumberInput';
import { useCardNumberInput } from '../components/use-card-number-input.hook';
import { StepProps } from './step.props';

const NOT_UKRAINIAN_CARD_ERROR_MESSAGE = 'Ukrainian bank card is required.';

export const InitialStep: FC<Omit<StepProps, 'orderInfo'>> = ({ isApiError, setOrderInfo, setStep, setIsApiError }) => {
  const { analyticsState } = useAnalyticsState();

  const [isLoading, setLoading] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const [inputAmount, setInputAmount] = useState<number | undefined>(undefined);
  const cardNumberInput = useCardNumberInput(isFormSubmitted);

  const { minExchangeAmount, maxExchangeAmount, isMinMaxLoading } = useMinMaxExchangeAmounts(setIsApiError, true);

  const { isMinAmountError, isMaxAmountError, isInsufficientTezBalanceError, disabledProceed } = useDisabledProceed(
    inputAmount,
    minExchangeAmount,
    maxExchangeAmount,
    true
  );

  const isFormValid = useMemo(
    () => !disabledProceed && !isApiError && cardNumberInput.isValid && cardNumberInput.isTouched,
    [disabledProceed, isApiError, cardNumberInput.isValid, cardNumberInput.isTouched]
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
    setIsFormSubmitted(true);

    if (!isFormValid) {
      return;
    }

    setLoading(true);

    createAliceBobOrder(true, inputAmount?.toString() ?? '0', analyticsState.userId, undefined, cardNumberInput.value)
      .then(response => {
        setOrderInfo(response.data.orderInfo);
        setStep(1);
      })
      .catch(err => {
        if (err.response.data.message === NOT_UKRAINIAN_CARD_ERROR_MESSAGE) {
          cardNumberInput.setCustomError(t('onlyForUkrainianCards'));
        } else {
          setIsApiError(true);
        }
      })
      .finally(() => setLoading(false));
  };

  const handleInputAmountChange = (amount?: number) => setInputAmount(amount);

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
          amountInputDisabled={isMinMaxLoading}
          amount={inputAmount}
          label={<T id="send" />}
          currency={{ code: 'TEZ' }}
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
          amountInputDisabled
          label={<T id="get" />}
          currency={{ code: 'UAH', icon: FIAT_ICONS_SRC.UAH }}
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
          <span className={classNames('inline-flex items-center font-inter text-xs font-normal text-orange-500')}>
            <AlertIcon className="mr-1 stroke-current" />
            <T id="onlyForUkrainianCards" />
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
