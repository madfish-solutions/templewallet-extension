import React, { FC, useCallback, useMemo, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import Divider from 'app/atoms/Divider';
import { FormSubmitButton } from 'app/atoms/FormSubmitButton';
import { useDisabledProceed } from 'app/hooks/AliceBob/useDisabledProceed';
import { useMinMaxExchangeAmounts } from 'app/hooks/AliceBob/useMinMaxExchangeAmounts';
import { useOutputEstimation } from 'app/hooks/AliceBob/useOutputEstimation';
import { ReactComponent as AttentionRedIcon } from 'app/icons/attentionRed.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TopUpInput } from 'app/templates/TopUpInput';
import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { createAliceBobOrder } from 'lib/apis/temple';
import { T } from 'lib/i18n/react';
import { FIAT_ICONS_SRC } from 'lib/icons';
import { useAccount } from 'lib/temple/front';

import { BuySelectors } from '../../Buy.selectors';
import styles from '../../Crypto/Exolix/Exolix.module.css';
import { ALICE_BOB_PRIVACY_LINK, ALICE_BOB_TERMS_LINK } from './config';

const REQUEST_LATENCY = 500;

export const AliceBobTopUp: FC = () => {
  const { analyticsState } = useAnalyticsState();
  const { publicKeyHash: walletAddress } = useAccount();

  const [inputAmount, setInputAmount] = useState<number | undefined>(undefined);
  const [link, setLink] = useState('');

  const [isApiError, setIsApiError] = useState(false);
  const [linkIsLoading, setLinkIsLoading] = useState(false);

  const { minExchangeAmount, maxExchangeAmount, isMinMaxLoading } = useMinMaxExchangeAmounts(setIsApiError);

  const { isMinAmountError, isMaxAmountError, disabledProceed } = useDisabledProceed(
    inputAmount,
    minExchangeAmount,
    maxExchangeAmount
  );

  const { estimationIsLoading, outputAmount } = useOutputEstimation(
    inputAmount,
    isMinAmountError,
    isMaxAmountError,
    setIsApiError
  );

  const exchangeRate = useMemo(
    () => (inputAmount && outputAmount > 0 ? (inputAmount / outputAmount).toFixed(4) : 0),
    [inputAmount, outputAmount]
  );

  const linkRequest = useCallback(
    (amount = 0) => {
      if (!disabledProceed) {
        setLinkIsLoading(true);
        createAliceBobOrder(false, amount.toString(), analyticsState.userId, walletAddress)
          .then(response => setLink(response.data.orderInfo.payUrl))
          .catch(() => setIsApiError(true))
          .finally(() => setLinkIsLoading(false));
      }
    },
    [disabledProceed, analyticsState.userId, walletAddress]
  );

  const debouncedLinkRequest = useDebouncedCallback(linkRequest, REQUEST_LATENCY);

  const handleInputAmountChange = useCallback(
    (amount?: number) => {
      setLink('');
      setInputAmount(amount);
      debouncedLinkRequest(amount);
    },
    [debouncedLinkRequest]
  );

  const isLoading = linkIsLoading || estimationIsLoading;

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
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

      <div className="max-w-sm mx-auto mt-4 mb-10 text-center font-inter font-normal text-gray-700">
        <TopUpInput
          amountInputDisabled={isMinMaxLoading}
          label={<T id="send" />}
          amount={inputAmount}
          currency={{ code: 'UAH', icon: FIAT_ICONS_SRC.UAH }}
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
          amountInputDisabled
          label={<T id="get" />}
          currency={{ code: 'TEZ' }}
          currenciesList={[]}
          amount={outputAmount}
        />

        <Divider style={{ marginTop: '40px', marginBottom: '20px' }} />

        <div className={styles['exchangeRateBlock']}>
          <p className={styles['exchangeTitle']}>
            <T id={'exchangeRate'} />
          </p>
          <p className={styles['exchangeData']}>1 TEZ ≈ {exchangeRate} UAH</p>
        </div>

        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            padding: 0
          }}
          disabled={disabledProceed || !link}
          loading={isLoading || isMinMaxLoading}
          testID={BuySelectors.AliceBob}
        >
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-auto"
            style={{
              paddingTop: '0.625rem',
              paddingBottom: '0.625rem'
            }}
          >
            <T id="next" />
          </a>
        </FormSubmitButton>

        <div className="border-solid border-gray-300" style={{ borderTopWidth: 1 }}>
          <p className="mt-6">
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <T id="next" />,
                <a className={styles['link']} rel="noreferrer" href={ALICE_BOB_PRIVACY_LINK} target="_blank">
                  <T id="termsOfUse" />
                </a>,
                <a className={styles['link']} rel="noreferrer" href={ALICE_BOB_TERMS_LINK} target="_blank">
                  <T id="privacyPolicy" />
                </a>
              ]}
            />
          </p>

          <p className="mt-6">
            <T id="warningTopUpServiceMessage" />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
