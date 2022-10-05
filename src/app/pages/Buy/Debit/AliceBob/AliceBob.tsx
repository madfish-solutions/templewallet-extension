import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { FormSubmitButton } from 'app/atoms/FormSubmitButton';

import { useAnalyticsState } from '../../../../../lib/analytics/use-analytics-state.hook';
import { T } from '../../../../../lib/i18n/react';
import makeBuildQueryFn from '../../../../../lib/makeBuildQueryFn';
import { useAccount } from '../../../../../lib/temple/front';
import Divider from '../../../../atoms/Divider';
import { ReactComponent as AttentionRedIcon } from '../../../../icons/attentionRed.svg';
import PageLayout from '../../../../layouts/PageLayout';
import { WithdrawSelectors } from '../../../Withdraw/Withdraw.selectors';
import { BuySelectors } from '../../Buy.selectors';
import styles from '../../Crypto/Exolix/Exolix.module.css';
import { TopUpInput } from '../Utorg/components/TopUpInput/TopUpInput';
import { useDisabledProceed } from './hooks/useDisabledProceed';
import { useOutputEstimation } from './hooks/useOutputEstimation';
import { useUpdatedExchangeInfo } from './hooks/useUpdatedExchangeInfo';

const REQUEST_LATENCY = 200;

interface AliceBobProps {
  isWithdraw?: boolean;
}

export const AliceBob: FC<AliceBobProps> = ({ isWithdraw = false }) => {
  const { analyticsState } = useAnalyticsState();
  const { publicKeyHash: walletAddress } = useAccount();

  const [inputAmount, setInputAmount] = useState(0);
  const [link, setLink] = useState('');

  const [isLoading, setLoading] = useState(false);

  const inputCurrency = isWithdraw ? 'XTZ' : 'UAH';
  const outputCurrency = isWithdraw ? 'UAH' : 'XTZ';

  const { minExchangeAmount, maxExchangeAmount, isMinMaxLoading } = useUpdatedExchangeInfo(isWithdraw);

  const { isApiError, isMinAmountError, isMaxAmountError, disabledProceed } = useDisabledProceed(
    inputAmount,
    minExchangeAmount,
    maxExchangeAmount
  );

  const outputAmount = useOutputEstimation(isWithdraw, inputAmount, disabledProceed, setLoading);

  const exchangeRate = useMemo(
    () => (inputAmount > 0 ? (outputAmount / inputAmount).toFixed(4) : 0),
    [inputAmount, outputAmount]
  );

  const linkRequest = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!disabledProceed) {
        setLoading(true);
        getSignedAliceBobUrl({
          isWithdraw: String(isWithdraw),
          amount: e.target.value,
          userId: analyticsState.userId,
          walletAddress
        })
          .then(({ url }) => setLink(url))
          .finally(() => setLoading(false));
      }
    },
    [disabledProceed, isWithdraw, analyticsState.userId, walletAddress]
  );

  const debouncedLinkRequest = useDebouncedCallback(linkRequest, REQUEST_LATENCY);

  const handleInputAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInputAmount(Number(e.target.value));
      debouncedLinkRequest(e);
    },
    [debouncedLinkRequest]
  );

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id={isWithdraw ? 'sellTez' : 'buyWithCard'} />
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
      <div className="mx-auto mt-4 mb-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <TopUpInput
          singleToken
          isDefaultUahIcon
          amountInputDisabled={isMinMaxLoading}
          label={<T id="send" />}
          currencyName={inputCurrency}
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
          currencyName={outputCurrency}
          currenciesList={[]}
          amount={outputAmount}
        />
        <Divider style={{ marginTop: '40px', marginBottom: '20px' }} />
        <div className={styles['exchangeRateBlock']}>
          <p className={styles['exchangeTitle']}>
            <T id={'exchangeRate'} />
          </p>
          <p className={styles['exchangeData']}>1 XTZ ≈ {exchangeRate} UAH</p>
        </div>
        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            padding: 0
          }}
          disabled={disabledProceed || link === ''}
          loading={isLoading || isMinMaxLoading}
          testID={isWithdraw ? WithdrawSelectors.AliceBob : BuySelectors.AliceBob}
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
          <p className="mt-6">
            <T id={'warningTopUpServiceMessage'} />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

const buildQuery = makeBuildQueryFn<Record<string, string>, any>('http://localhost:3000');
const getSignedAliceBobUrl = buildQuery('GET', '/api/alice-bob-sign', [
  'isWithdraw',
  'amount',
  'userId',
  'walletAddress'
]);
export const getAliceBobPairInfo = buildQuery('GET', '/api/alice-bob-pair-info', ['isWithdraw']);
export const getAliceBobOutputEstimation = buildQuery('GET', '/api/alice-bob-output-estimation', [
  'isWithdraw',
  'amount'
]);
