import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { useAnalyticsState } from '../../../../lib/analytics/use-analytics-state.hook';
import { T } from '../../../../lib/i18n/react';
import makeBuildQueryFn from '../../../../lib/makeBuildQueryFn';
import { useAccount } from '../../../../lib/temple/front';
import FormSubmitButton from '../../../atoms/FormSubmitButton';
import { TopUpInput } from '../../../atoms/TopUpInput/TopUpInput';
import { ReactComponent as AttentionRedIcon } from '../../../icons/attentionRed.svg';
import PageLayout from '../../../layouts/PageLayout';
import styles from '../../BuyCrypto/BuyCrypto.module.css';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';

const buildQuery = makeBuildQueryFn<Record<string, string>, any>('https://temple-api.production.madservice.xyz');
const getSignedAliceBobUrl = buildQuery('GET', '/api/alice-bob-sign', ['amount', 'userId', 'walletAddress']);
const getAliceBobPairInfo = buildQuery('GET', '/api/alice-bob-pair-info');

const REQUEST_LATENCY = 200;

export const AliceBob = () => {
  const { analyticsState } = useAnalyticsState();
  const { publicKeyHash: walletAddress } = useAccount();

  const [minExchangeAmount, setMinExchangeAmount] = useState(600);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(29500);

  const [amount, setAmount] = useState(0);
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isError = useMemo(
    () => minExchangeAmount === 0 && maxExchangeAmount === 0,
    [minExchangeAmount, maxExchangeAmount]
  );
  const isMinAmountError = useMemo(() => amount !== 0 && amount < minExchangeAmount, [amount, minExchangeAmount]);
  const isMaxAmountError = useMemo(() => amount !== 0 && amount > maxExchangeAmount, [amount, maxExchangeAmount]);
  const disabledProceed = useMemo(
    () => isMinAmountError || isMaxAmountError || amount === 0,
    [isMinAmountError, isMaxAmountError, amount]
  );

  useEffect(() => {
    (async () => {
      getAliceBobPairInfo({})
        .then(response => {
          setMinExchangeAmount(response.minAmount);
          setMaxExchangeAmount(response.maxAmount);
        })
        .catch(() => {
          setMinExchangeAmount(0);
          setMaxExchangeAmount(0);
        });
    })();
  }, []);

  const linkRequest = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!disabledProceed) {
        try {
          setIsLoading(true);

          const response = await getSignedAliceBobUrl({
            amount: e.target.value,
            userId: analyticsState.userId,
            walletAddress
          });

          setLink(response.url);
          setIsLoading(false);
        } catch {}
      }
    },
    [disabledProceed, analyticsState.userId, walletAddress]
  );

  const debouncedLinkRequest = useDebouncedCallback(linkRequest, REQUEST_LATENCY);

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
        </div>
      }
    >
      <div className="mx-auto my-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <h3 className="mb-6" style={{ fontSize: 17 }}>
          <T id="enterAmount" />
        </h3>
        {isError && (
          <div className="flex w-full justify-center mb-6 text-red-600" style={{ fontSize: 17 }}>
            <AttentionRedIcon />
            <h3 className="ml-1">
              <T id="aliceBobError" />
            </h3>
          </div>
        )}
        <TopUpInput
          type="fiat"
          currency="UAH"
          minAmount={`${minExchangeAmount}.00`}
          maxAmount={`${maxExchangeAmount}.00`}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          onChangeInputHandler={e => {
            setAmount(Number(e.target.value));
            debouncedLinkRequest(e);
          }}
        />
        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            padding: 0
          }}
          disabled={disabledProceed}
          loading={isLoading}
          testID={SelectCryptoSelectors.AliceBob}
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
