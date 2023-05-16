import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { FormSubmitButton } from 'app/atoms';
import Divider from 'app/atoms/Divider';
import { ReactComponent as AttentionRedIcon } from 'app/icons/attentionRed.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TopUpInput } from 'app/templates/TopUpInput';
import { CurrencyFiat } from 'app/templates/TopUpInput/types';
import { createOrder } from 'lib/apis/utorg';
import { T } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';

import { BuySelectors } from '../../Buy.selectors';
import styles from '../../Crypto/Exolix/Exolix.module.css';
import { useDisabledProceed } from './hooks/useDisabledProceed';
import { useExchangeRate } from './hooks/useExchangeRate';
import { useOutputAmount } from './hooks/useOutputAmount';
import { useUpdatedExchangeInfo } from './hooks/useUpdatedExchangeInfo';
import { UTORG_PRIVICY_LINK, UTORG_TERMS_LINK, buildIconSrc, supplyCurrenciesNames } from './utils';

const DEFAULT_CURRENCY = 'USD';
const REQUEST_LATENCY = 300;

export const Utorg = () => {
  const [inputCurrencyCode, setInputCurrencyCode] = useState(DEFAULT_CURRENCY);
  const [inputAmount, setInputAmount] = useState<number | undefined>();

  const [link, setLink] = useState('');

  const [isApiError, setIsApiError] = useState(false);
  const [isOrderLinkLoading, setOrderLinkLoading] = useState(false);

  const { publicKeyHash } = useAccount();

  const { isOutputLoading, outputAmount } = useOutputAmount(inputAmount, inputCurrencyCode);

  const { isCurrenciesLoading, currencies, minAmount, maxAmount, isMinMaxLoading } = useUpdatedExchangeInfo(
    inputCurrencyCode,
    setIsApiError
  );

  const currenciesWithNames = useMemo(() => supplyCurrenciesNames(currencies), [currencies]);

  const { isRateLoading, exchangeRate } = useExchangeRate(inputAmount, minAmount, inputCurrencyCode);

  const { isMinAmountError, isMaxAmountError, disabledProceed } = useDisabledProceed(
    inputAmount,
    minAmount,
    maxAmount,
    isApiError
  );

  const inputCurrency: CurrencyFiat = useMemo(
    () => ({ code: inputCurrencyCode, icon: buildIconSrc(inputCurrencyCode) }),
    [inputCurrencyCode]
  );

  const linkRequest = useCallback(() => {
    if (disabledProceed) return;
    setOrderLinkLoading(true);
    createOrder(outputAmount, inputCurrencyCode, publicKeyHash)
      .then(setLink)
      .finally(() => setOrderLinkLoading(false));
  }, [outputAmount, disabledProceed, inputCurrencyCode, publicKeyHash]);

  const debouncedLinkRequest = useDebouncedCallback(linkRequest, REQUEST_LATENCY);

  useEffect(() => debouncedLinkRequest(), [debouncedLinkRequest, inputAmount, inputCurrencyCode]);

  const isLoading = isOutputLoading || isRateLoading || isOrderLinkLoading || isCurrenciesLoading;

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
          currency={inputCurrency}
          currenciesList={currenciesWithNames}
          minAmount={String(minAmount)}
          maxAmount={String(maxAmount || '---')}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          onCurrencySelect={currency => setInputCurrencyCode(currency.code)}
          onAmountChange={setInputAmount}
          amountInputDisabled={isMinMaxLoading}
          fitIcons={true}
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
          <p className={styles['exchangeData']}>
            1 TEZ ≈ {exchangeRate} {inputCurrencyCode}
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
          testID={BuySelectors.UtorgButton}
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
