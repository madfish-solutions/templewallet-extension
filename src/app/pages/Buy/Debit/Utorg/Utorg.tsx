import React, { useCallback, useEffect, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { FormSubmitButton } from 'app/atoms';
import Divider from 'app/atoms/Divider';
import { ReactComponent as AttentionRedIcon } from 'app/icons/attentionRed.svg';
import PageLayout from 'app/layouts/PageLayout';
import { createOrder } from 'lib/apis/utorg';
import { T } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';

import { BuySelectors } from '../../Buy.selectors';
import styles from '../../Crypto/Exolix/Exolix.module.css';
import { TopUpInput } from './components/TopUpInput/TopUpInput';
import { UTORG_PRIVICY_LINK, UTORG_TERMS_LINK } from './config';
import { useDisabledProceed } from './hooks/useDisabledProceed';
import { useExchangeRate } from './hooks/useExchangeRate';
import { useOutputAmount } from './hooks/useOutputAmount';
import { useUpdatedExchangeInfo } from './hooks/useUpdatedExchangeInfo';

const DEFAULT_CURRENCY = 'USD';
const REQUEST_LATENCY = 300;

export const Utorg = () => {
  const [inputCurrency, setInputCurrency] = useState(DEFAULT_CURRENCY);
  const [inputAmount, setInputAmount] = useState<number | undefined>(undefined);

  const [link, setLink] = useState('');

  const [isApiError, setIsApiError] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const { publicKeyHash } = useAccount();

  const exchangeRate = useExchangeRate(inputAmount, inputCurrency, setLoading);
  const outputAmount = useOutputAmount(inputAmount, inputCurrency, setLoading);

  const { currencies, minXtzExchangeAmount, maxXtzExchangeAmount, isMinMaxLoading } = useUpdatedExchangeInfo(
    setLoading,
    setIsApiError
  );

  const { isMinAmountError, isMaxAmountError, disabledProceed } = useDisabledProceed(
    inputAmount,
    outputAmount,
    minXtzExchangeAmount,
    maxXtzExchangeAmount,
    isApiError
  );

  const linkRequest = useCallback(() => {
    if (!disabledProceed) {
      setLoading(true);
      createOrder(outputAmount, inputCurrency, publicKeyHash)
        .then(url => setLink(url))
        .finally(() => setLoading(false));
    }
  }, [outputAmount, disabledProceed, inputCurrency, publicKeyHash]);

  const debouncedLinkRequest = useDebouncedCallback(linkRequest, REQUEST_LATENCY);

  useEffect(() => debouncedLinkRequest(), [debouncedLinkRequest, inputAmount, inputCurrency]);

  const handleInputAmountChange = useCallback((amount?: number) => setInputAmount(amount), []);

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
          isSearchable
          label={<T id="send" />}
          amount={inputAmount}
          currencyName={inputCurrency}
          currenciesList={currencies}
          setCurrencyName={setInputCurrency}
          onAmountChange={handleInputAmountChange}
          amountInputDisabled={isMinMaxLoading}
          className="mb-4"
        />

        <br />
        <TopUpInput
          readOnly
          singleToken
          amountInputDisabled
          label={<T id="get" />}
          currencyName="TEZ"
          currenciesList={[]}
          minAmount={minXtzExchangeAmount.toString()}
          maxAmount={maxXtzExchangeAmount.toString()}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          amount={outputAmount}
        />
        <Divider style={{ marginTop: '40px', marginBottom: '20px' }} />
        <div className={styles['exchangeRateBlock']}>
          <p className={styles['exchangeTitle']}>
            <T id={'exchangeRate'} />
          </p>
          <p className={styles['exchangeData']}>
            1 {inputCurrency} ≈ {exchangeRate} TEZ
          </p>
        </div>
        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            padding: 0
          }}
          disabled={disabledProceed || link === ''}
          loading={isLoading || isMinMaxLoading}
          testID={BuySelectors.Utorg}
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
                <a className={styles['link']} rel="noreferrer" href={UTORG_TERMS_LINK} target="_blank">
                  <T id={'termsOfUse'} />
                </a>,
                <a className={styles['link']} rel="noreferrer" href={UTORG_PRIVICY_LINK} target="_blank">
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
