import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';
import { useDebounce } from 'use-debounce/esm';

import { T } from '../../../../../lib/i18n/react';
import { useAccount } from '../../../../../lib/temple/front';
import { createOrder } from '../../../../../lib/utorg-api';
import Divider from '../../../../atoms/Divider';
import FormSubmitButton from '../../../../atoms/FormSubmitButton';
import { ReactComponent as AttentionRedIcon } from '../../../../icons/attentionRed.svg';
import PageLayout from '../../../../layouts/PageLayout';
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
const INPUT_UPDATE_LATENCY = 200;

export const Utorg = () => {
  const [inputCurrency, setInputCurrency] = useState(DEFAULT_CURRENCY);

  const [inputAmount, setInputAmount] = useState(0);

  const [link, setLink] = useState('');

  const [isApiError, setIsApiError] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const { publicKeyHash } = useAccount();
  const [inputAmountDebounced] = useDebounce(inputAmount, INPUT_UPDATE_LATENCY);

  const exchangeRate = useExchangeRate(inputCurrency, setLoading, setIsApiError);
  const outputAmount = useOutputAmount(inputAmountDebounced, inputCurrency, setLoading, setIsApiError);

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
      createOrder(inputAmount, inputCurrency, publicKeyHash)
        .then(url => {
          setLink(url);
          setLoading(false);
        })
        .catch(() => {
          setIsApiError(true);
          setLoading(false);
        });
    }
  }, [inputAmount, disabledProceed, inputCurrency, publicKeyHash]);

  const debouncedLinkRequest = useDebouncedCallback(linkRequest, REQUEST_LATENCY);

  useEffect(() => debouncedLinkRequest(), [debouncedLinkRequest, inputAmount, inputCurrency]);

  const handleInputAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setInputAmount(Number(e.target.value)),
    []
  );

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
      <div className="mx-auto mt-4 mb-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <TopUpInput
          currencyName={inputCurrency}
          currenciesList={currencies}
          label={<T id="send" />}
          setCurrencyName={setInputCurrency}
          className="mb-4"
          onAmountChange={handleInputAmountChange}
          amountInputDisabled={isMinMaxLoading}
          isSearchable
        />

        <br />
        <TopUpInput
          readOnly
          singleToken
          amountInputDisabled
          label={<T id="get" />}
          currenciesList={[]}
          currencyName="XTZ"
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
            1 {inputCurrency} ≈ {exchangeRate} XTZ
          </p>
        </div>
        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            padding: 0
          }}
          disabled={disabledProceed}
          loading={isLoading}
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
            <T id={isMinMaxLoading ? 'updatingMinMax' : 'next'} />
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
