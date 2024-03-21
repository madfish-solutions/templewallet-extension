import React, { FC, useEffect, useState, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';
import { useDebounce } from 'use-debounce';

import { FormSubmitButton } from 'app/atoms';
import Divider from 'app/atoms/Divider';
import styles from 'app/pages/Buy/Crypto/Exolix/Exolix.module.css';
import ErrorComponent from 'app/pages/Buy/Crypto/Exolix/steps/ErrorComponent';
import WarningComponent from 'app/pages/Buy/Crypto/Exolix/steps/WarningComponent';
import { TopUpInput } from 'app/templates/TopUpInput';
import { T, t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useAccount } from 'lib/temple/front';

import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK, INITIAL_COIN_FROM, INITIAL_COIN_TO } from '../config';
import { ExchangeDataInterface, ExchangeDataStatusEnum, OutputCurrencyInterface } from '../exolix.interface';
import { ExolixSelectors } from '../Exolix.selectors';
import { getCurrencies, loadMinMaxFields, queryExchange, submitExchange } from '../exolix.util';
import { useCurrenciesCount } from '../hooks/useCurrenciesCount.hook';

const VALUE_PLACEHOLDER = '---';
const EXOLIX_DECIMALS = 8;

interface Props {
  exchangeData: ExchangeDataInterface | null;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const InitialStep: FC<Props> = ({ exchangeData, setExchangeData, setStep, isError, setIsError }) => {
  const { publicKeyHash } = useAccount();

  const [coinFrom, setCoinFrom] = useState<OutputCurrencyInterface>(INITIAL_COIN_FROM);
  const [coinTo, setCoinTo] = useState<OutputCurrencyInterface>(INITIAL_COIN_TO);

  const [amount, setAmount] = useState<number | undefined>();
  const [minAmount, setMinAmount] = useState<number | nullish>();
  const [maxAmount, setMaxAmount] = useState<number | nullish>();

  const [debouncedAmount] = useDebounce(amount, 500);

  const { data: allCurrencies, isValidating: isCurrenciesLoading } = useTypedSWR(
    ['exolix/api/currencies'],
    getCurrencies
  );

  const { inputCurrencies, outputCurrencies } = useMemo(() => {
    const inputCurrencies: OutputCurrencyInterface[] = [];
    const outputCurrencies: OutputCurrencyInterface[] = [];

    allCurrencies?.forEach(currency => {
      if (currency.network.code === 'XTZ') {
        outputCurrencies.push(currency);
      } else {
        inputCurrencies.push(currency);
      }
    });

    return { inputCurrencies, outputCurrencies };
  }, [allCurrencies]);

  const currenciesCount = useCurrenciesCount();

  const submitExchangeHandler = async () => {
    try {
      const data = await submitExchange({
        coinFrom: coinFrom.code,
        networkFrom: coinFrom.network.code,
        coinTo: coinTo.code,
        networkTo: coinTo.network.code,
        amount: amount ?? 0,
        withdrawalAddress: publicKeyHash,
        withdrawalExtraId: ''
      });
      setExchangeData(data);
      if (data.status === ExchangeDataStatusEnum.WAIT) {
        setStep(1);
      } else if (data.status === ExchangeDataStatusEnum.CONFIRMATION) {
        setStep(2);
      } else if (data.status === ExchangeDataStatusEnum.EXCHANGING) {
        setStep(3);
      }
    } catch (e) {
      setIsError(true);
    }
  };

  const { data: ratesData } = useTypedSWR(['exolix/api/rate', coinFrom, coinTo, amount], () =>
    queryExchange({
      coinFrom: coinFrom.code,
      coinFromNetwork: coinFrom.network.code,
      amount: amount ?? 0,
      coinTo: coinTo.code,
      coinToNetwork: coinTo.network.code
    })
  );

  const { rate, toAmount } = ratesData || { rate: null, toAmount: 0 };

  useEffect(() => {
    (async () => {
      const { finalMinAmount, finalMaxAmount } = await loadMinMaxFields(
        coinFrom.code,
        coinFrom.network?.code,
        coinTo.code,
        coinTo.network?.code
      );
      setMinAmount(finalMinAmount);
      setMaxAmount(finalMaxAmount);
    })();
  }, [coinFrom, coinTo]);

  const isMinAmountError = isDefined(minAmount) && minAmount > Number(amount);
  const isMaxAmountError = maxAmount != null && debouncedAmount !== 0 && Number(debouncedAmount) > maxAmount;

  const proceedForbidden = useMemo(() => {
    if (ratesData == null) return true;
    if (isMinAmountError || isMaxAmountError) return true;
    if (Number(rate) <= 0 || toAmount <= 0) return true;

    return false;
  }, [ratesData, rate, toAmount, isMinAmountError, isMaxAmountError]);

  if (isError)
    return (
      <ErrorComponent
        exchangeData={exchangeData}
        setIsError={setIsError}
        setExchangeData={setExchangeData}
        setStep={setStep}
      />
    );

  const minAmountString = isDefined(minAmount) ? String(minAmount) : VALUE_PLACEHOLDER;
  const maxAmountString = isDefined(maxAmount) ? String(maxAmount) : VALUE_PLACEHOLDER;

  return (
    <>
      <p className={styles['title']}>
        <T id={'exchangeDetails'} />
      </p>

      <p className={styles['description']}>
        <T id={'exchangeDetailsDescription'} substitutions={[currenciesCount]} />
      </p>

      <WarningComponent currency={coinFrom} />

      <Divider style={{ marginBottom: '10px' }} />

      <TopUpInput
        amount={amount}
        currency={coinFrom}
        currenciesList={inputCurrencies}
        isCurrenciesLoading={isCurrenciesLoading}
        decimals={EXOLIX_DECIMALS}
        label={<T id="send" />}
        emptyListPlaceholder={t('dropdownNoItems')}
        onCurrencySelect={setCoinFrom}
        onAmountChange={setAmount}
        minAmount={minAmountString}
        maxAmount={maxAmountString}
        isMinAmountError={isMinAmountError}
        isMaxAmountError={isMaxAmountError}
        isSearchable
      />

      <br />

      <TopUpInput
        currency={coinTo}
        currenciesList={outputCurrencies}
        isCurrenciesLoading={isCurrenciesLoading}
        decimals={EXOLIX_DECIMALS}
        label={<T id="get" />}
        emptyListPlaceholder={t('dropdownNoItems')}
        readOnly={true}
        amountInputDisabled={true}
        amount={toAmount}
        onCurrencySelect={setCoinTo}
      />

      <Divider style={{ marginTop: '40px', marginBottom: '20px' }} />

      <div className={classNames('flex justify-between', Number(rate) < 0 ? 'text-red-700' : 'text-gray-600')}>
        <p className={styles['exchangeTitle']}>
          <T id={'exchangeRate'} />
        </p>
        <p className={styles['exchangeData']}>
          {rate ? `1 ${coinFrom.code} = ${rate} ${coinTo.code}` : VALUE_PLACEHOLDER}
        </p>
      </div>

      <FormSubmitButton
        className="w-full justify-center border-none mt-6"
        style={{
          padding: '10px 2rem',
          background: '#4299e1'
        }}
        onClick={submitExchangeHandler}
        disabled={proceedForbidden}
        testID={ExolixSelectors.topupFirstStepSubmitButton}
      >
        <T id={'topUp'} />
      </FormSubmitButton>

      <p className={styles['privacyAndPolicy']}>
        <T
          id="privacyAndPolicyLinks"
          substitutions={[
            <T id={'topUp'} />,
            <a className={styles['link']} rel="noreferrer" href={EXOLIX_TERMS_LINK} target="_blank">
              <T id={'termsOfUse'} />
            </a>,
            <a className={styles['link']} rel="noreferrer" href={EXOLIX_PRIVICY_LINK} target="_blank">
              <T id={'privacyPolicy'} />
            </a>
          ]}
        />
      </p>
    </>
  );
};

export default InitialStep;
