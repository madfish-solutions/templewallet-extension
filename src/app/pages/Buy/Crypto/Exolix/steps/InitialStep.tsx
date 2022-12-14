import React, { FC, useEffect, useState, useMemo } from 'react';

import classNames from 'clsx';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';

import { FormSubmitButton } from 'app/atoms';
import Divider from 'app/atoms/Divider';
import styles from 'app/pages/Buy/Crypto/Exolix/Exolix.module.css';
import ErrorComponent from 'app/pages/Buy/Crypto/Exolix/steps/ErrorComponent';
import WarningComponent from 'app/pages/Buy/Crypto/Exolix/steps/WarningComponent';
import { useAssetUSDPrice } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';

import { TopUpInput } from '../components/TopUpInput/TopUpInput';
import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK, outputTokensList } from '../config';
import { ExchangeDataInterface, ExchangeDataStatusEnum } from '../exolix.interface';
import { ExolixSelectors } from '../Exolix.selectors';
import { getCurrencies, queryExchange, submitExchange } from '../exolix.util';
import { useCurrenciesCount } from '../hooks/useCurrenciesCount.hook';

const INITIAL_COIN_FROM = {
  code: 'BTC',
  name: 'Bitcoin',
  icon: 'https://exolix.com/icons/coins/BTC.png',
  network: 'BTC',
  networkFullName: 'Bitcoin'
};
const MAX_DOLLAR_VALUE = 10_000;
const AVERAGE_COMMISSION = 300;
const VALUE_PLACEHOLDER = '---';

interface Props {
  exchangeData: ExchangeDataInterface | null;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const InitialStep: FC<Props> = ({ exchangeData, setExchangeData, setStep, isError, setIsError }) => {
  const { publicKeyHash } = useAccount();

  const [coinFrom, setCoinFrom] = useState(INITIAL_COIN_FROM);
  const [coinTo, setCoinTo] = useState(outputTokensList[0]!);

  const [amount, setAmount] = useState<number | undefined>();
  const [maxAmountFetched, setMaxAmountFetched] = useState<number | nullish>();

  const [debouncedAmount] = useDebounce(amount, 500);

  const coinToPriceUSD = useAssetUSDPrice(coinTo.slug!);

  const { data: currencies, isValidating: isCurrenciesLoading } = useSWR(['exolix/api/currencies'], getCurrencies);

  const currenciesCount = useCurrenciesCount();

  const submitExchangeHandler = async () => {
    try {
      const data = await submitExchange({
        coinFrom: coinFrom.code,
        networkFrom: coinFrom.network,
        coinTo: coinTo.code,
        networkTo: coinTo.network,
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

  const { data: ratesData } = useSWR(['exolix/api/rate', coinFrom, coinTo, amount], () =>
    queryExchange({
      coinFrom: coinFrom.code,
      coinFromNetwork: coinFrom.network,
      amount: amount ?? 0,
      coinTo: coinTo.code,
      coinToNetwork: coinTo.network
    })
  );

  const { rate, minAmount, toAmount } = ratesData || { rate: null, minAmount: 0, toAmount: 0 };

  useEffect(() => {
    setMaxAmountFetched(undefined);
    (async (): Promise<void> => {
      const maxCoinToAmount = (MAX_DOLLAR_VALUE + AVERAGE_COMMISSION) / (coinToPriceUSD ?? 0);

      if (!Number.isFinite(maxCoinToAmount)) return void setMaxAmountFetched(null);

      const { toAmount: maxCoinFromAmount } = await queryExchange({
        coinFrom: coinTo.code,
        coinFromNetwork: coinTo.network,
        amount: maxCoinToAmount,
        coinTo: coinFrom.code,
        coinToNetwork: coinFrom.network
      });

      setMaxAmountFetched(maxCoinFromAmount);
    })();
  }, [coinFrom, coinTo, coinToPriceUSD]);

  const maxAmount = useMemo(() => {
    if (ratesData == null || maxAmountFetched == null) return;
    if (maxAmountFetched < minAmount) return null;
    return maxAmountFetched;
  }, [ratesData, maxAmountFetched, minAmount]);

  const isMinAmountError = minAmount > Number(amount);
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

  const minAmountString = minAmount == null ? '0' : String(minAmount);
  const maxAmountString = maxAmount === null ? ' ∞' : maxAmount == null ? VALUE_PLACEHOLDER : String(maxAmount);

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
        currenciesList={currencies ?? []}
        isCurrenciesLoading={isCurrenciesLoading}
        label={<T id="send" />}
        setCurrency={setCoinFrom}
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
        currenciesList={outputTokensList}
        label={<T id="get" />}
        readOnly={true}
        amountInputDisabled={true}
        amount={toAmount}
        setCurrency={setCoinTo}
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
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: '#4299e1',
          marginTop: '24px'
        }}
        onClick={submitExchangeHandler}
        disabled={proceedForbidden}
        testID={ExolixSelectors.TopupFirstStepSubmit}
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
