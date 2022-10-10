import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import { FormSubmitButton } from 'app/atoms/FormSubmitButton';
import { TopUpInput } from 'app/pages/Buy/Debit/Utorg/components/TopUpInput/TopUpInput';
import { aliceBobOrder, getSignedAliceBobUrl } from 'lib/alice-bob-api';
import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { T, t } from 'lib/i18n/react';
import { useAccount } from 'lib/temple/front';

import { useDisabledProceed } from '../../../../hooks/AliceBob/useDisabledProceed';
import { useOutputEstimation } from '../../../../hooks/AliceBob/useOutputEstimation';
import { useUpdatedExchangeInfo } from '../../../../hooks/AliceBob/useUpdatedExchangeInfo';
import { ReactComponent as AlertIcon } from '../../../../icons/alert.svg';
import { ReactComponent as AttentionRedIcon } from '../../../../icons/attentionRed.svg';
import PageLayout from '../../../../layouts/PageLayout';
import styles from '../../../Buy/Crypto/Exolix/Exolix.module.css';
import { handleNumberInput } from '../../../Buy/utils/handleNumberInput.util';
import { WithdrawSelectors } from '../../Withdraw.selectors';

export const AliceBobWithdraw: FC = () => {
  const { analyticsState } = useAnalyticsState();
  const { publicKeyHash: walletAddress } = useAccount();

  const [inputAmount, setInputAmount] = useState(0);
  const [paymentAddress, setPaymentAddress] = useState('');

  console.log(paymentAddress);
  const [isLoading, setLoading] = useState(false);

  const { minExchangeAmount, maxExchangeAmount, isMinMaxLoading } = useUpdatedExchangeInfo(true);

  const { isApiError, isMinAmountError, isMaxAmountError, disabledProceed } = useDisabledProceed(
    inputAmount,
    minExchangeAmount,
    maxExchangeAmount
  );

  const outputAmount = useOutputEstimation(inputAmount, disabledProceed, setLoading, true);

  const exchangeRate = useMemo(
    () => (inputAmount > 0 ? (outputAmount / inputAmount).toFixed(4) : 0),
    [inputAmount, outputAmount]
  );

  const handleSubmit = useCallback(() => {
    if (!disabledProceed) {
      setLoading(true);
      getSignedAliceBobUrl({
        isWithdraw: 'true',
        amount: inputAmount.toString(),
        userId: analyticsState.userId,
        walletAddress
      })
        .then(({ orderInfo }: { orderInfo: aliceBobOrder }) => setPaymentAddress(orderInfo.payCryptoAddress))
        .finally(() => setLoading(false));
    }
  }, [disabledProceed, inputAmount, analyticsState.userId, walletAddress]);

  const handleInputAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setInputAmount(Number(e.target.value)),
    []
  );

  const [isActive, setIsActive] = useState(false);
  const [card, setCard] = useState('');

  const handleFocus = () => setIsActive(true);
  const handleBlur = () => setIsActive(false);

  console.log(checkLuhn('4441 1144 4250 2546'), 'mono');
  console.log(checkLuhn('5169 3100 0962 4437'), 'pl');

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="sellTez" />
        </div>
      }
    >
      {isApiError && (
        <div className="flex w-full justify-center my-6 text-red-600" style={{ fontSize: 17 }}>
          <AttentionRedIcon />
          <h3 className="ml-1">
            <T id="serviceIsUnavailable" />
          </h3>
        </div>
      )}

      <p className={styles['title']}>
        <T id={'sellTezDetails'} />
      </p>
      <p className={styles['description']}>
        <T id={'sellDetailsDescription'} />
      </p>

      <div className="mx-auto mt-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <TopUpInput
          singleToken
          isDefaultUahIcon
          amountInputDisabled={isMinMaxLoading}
          label={<T id="send" />}
          currencyName="XTZ"
          currenciesList={[]}
          minAmount={minExchangeAmount.toString()}
          maxAmount={maxExchangeAmount.toString()}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
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
          <span className=" inline-flex items-center font-inter text-xs font-normal text-orange-500">
            <AlertIcon className="mr-1" />
            <T id="onlyForUkrainianCards" />
          </span>
        </div>

        <input
          value={handleCardDisplay(card)}
          placeholder={t('enterCardNumber')}
          style={{ color: '#1B262C' }}
          className={classNames(
            isActive && 'border-orange-500 bg-gray-100',
            'transition ease-in-out duration-200',
            'w-full border rounded-md border-gray-300',
            'p-4 leading-tight placeholder-alphagray',
            'font-inter font-normal text-sm'
          )}
          type="text"
          maxLength={20}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyPress={e => handleNumberInput(e, false)}
          onChange={e => setCard(e.target.value)}
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
          testID={WithdrawSelectors.AliceBobCreateOrder}
          onClick={handleSubmit}
        >
          <T id="next" />
        </FormSubmitButton>
        <div className="border-solid border-gray-300" style={{ borderTopWidth: 1 }}>
          <p className="mt-6">
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <T id={'next'} />,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/End-User-License-Agreement-Abex-Eng-6124123e256d456a83cffc3b2977c4dc"
                  target="_blank"
                >
                  <T id={'termsOfUse'} />
                </a>,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/Privacy-Policy-Abex-Eng-d70fa7cc134341a3ac4fd04816358b9e"
                  target="_blank"
                >
                  <T id={'privacyPolicy'} />
                </a>
              ]}
            />
          </p>
          <p className="my-6">
            <T id={'warningTopUpServiceMessage'} />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

const handleCardDisplay = (cardNumber: string) => {
  const rawText = [...cardNumber.split(' ').join('')];
  const creditCard: string[] = [];

  rawText.forEach((t, i) => {
    if (i % 4 === 0) creditCard.push(' ');
    creditCard.push(t);
  });

  return creditCard.join('');
};

const checkLuhn = (cardNumber: string) => {
  if (/[^0-9-\s]+/.test(cardNumber)) return false;

  let nCheck = 0,
    nDigit = 0,
    bEven = false;
  cardNumber = cardNumber.replace(/\D/g, '');

  for (let n = cardNumber.length - 1; n >= 0; n--) {
    const cDigit = cardNumber.charAt(n);
    nDigit = parseInt(cDigit, 10);

    if (bEven) {
      if ((nDigit *= 2) > 9) nDigit -= 9;
    }

    nCheck += nDigit;
    bEven = !bEven;
  }

  return nCheck % 10 === 0;
};
