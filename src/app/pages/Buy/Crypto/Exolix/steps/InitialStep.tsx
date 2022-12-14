import React, { FC, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
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
import { getCurrencies, getRate, submitExchange } from '../exolix.util';
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

interface Props {
  exchangeData: ExchangeDataInterface | null;
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void;
  setStep: (step: number) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
}

const InitialStep: FC<Props> = ({ exchangeData, setExchangeData, setStep, isError, setIsError }) => {
  const { publicKeyHash } = useAccount();

  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [coinFrom, setCoinFrom] = useState(INITIAL_COIN_FROM);
  const [coinTo, setCoinTo] = useState(outputTokensList[0]!);
  const [lastMinAmount, setLastMinAmount] = useState(new BigNumber(0));
  const [lastMaxAmount, setLastMaxAmount] = useState('0');

  const [depositAmount, setDepositAmount] = useState(0);
  const [disabledProceed, setDisableProceed] = useState(true);

  const [debouncedAmount] = useDebounce(amount, 500);

  const coinToPrice = useAssetUSDPrice(coinTo.slug!);

  const { data: currencies, isValidating: isCurrenciesLoading } = useSWR(['/api/currency'], getCurrencies);

  const currenciesCount = useCurrenciesCount();

  const handleAmountChange = (amount?: number) => {
    setDisableProceed(true);
    setAmount(amount);
  };

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
  const { data: rates = { toAmount: 0, rate: 0, minAmount: 0 } } = useSWR(
    ['/api/currency', coinTo, coinFrom, amount],
    () =>
      getRate({
        coinFrom: coinFrom.code,
        coinFromNetwork: coinFrom.network,
        amount: amount ?? 0,
        coinTo: coinTo.code,
        coinToNetwork: coinTo.network
      })
  );

  useEffect(() => {
    (async () => {
      try {
        const safeCoinToPrice = coinToPrice || new BigNumber(0);
        const coinToAmount = new BigNumber(MAX_DOLLAR_VALUE + AVERAGE_COMMISSION).div(safeCoinToPrice);
        const { toAmount } = await getRate({
          coinFrom: coinTo.code,
          coinFromNetwork: coinTo.network,
          amount: coinToAmount.toNumber(),
          coinTo: coinFrom.code,
          coinToNetwork: coinFrom.network
        });

        const maxAmount = new BigNumber(toAmount).toFixed(toAmount > 100 ? 2 : 6);
        setLastMaxAmount(maxAmount === 'Infinity' ? '---' : maxAmount);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [coinFrom, coinTo, coinToPrice]);

  const isMinAmountError = amount !== 0 && (lastMinAmount ? lastMinAmount.toNumber() : 0) > Number(amount);

  const isMaxAmountError =
    lastMaxAmount !== 'Infinity' && debouncedAmount !== 0 && Number(debouncedAmount) > Number(lastMaxAmount);

  useEffect(() => {
    setDepositAmount(rates.toAmount);
    if (amount === 0 || amount === undefined) {
      setDisableProceed(true);
    } else if (rates.minAmount === 0) {
      setDisableProceed(true);
    } else if (rates.minAmount > amount) {
      setDisableProceed(true);
    } else if (rates.toAmount === 0) {
      setDisableProceed(true);
    } else {
      setDisableProceed(false);
    }
    if (rates.minAmount > 0) {
      setLastMinAmount(new BigNumber(rates.minAmount));
    }
    if (isMaxAmountError) {
      setDisableProceed(true);
    }
  }, [rates, amount, isMaxAmountError, coinFrom]);

  return (
    <>
      {!isError ? (
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
            onAmountChange={handleAmountChange}
            minAmount={String(rates.minAmount)}
            maxAmount={lastMaxAmount}
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
            amount={depositAmount}
            setCurrency={setCoinTo}
          />

          <Divider style={{ marginTop: '40px', marginBottom: '20px' }} />

          <div className={styles['exchangeRateBlock']}>
            <p className={styles['exchangeTitle']}>
              <T id={'exchangeRate'} />
            </p>
            <p className={styles['exchangeData']}>
              {rates.rate ? `1 ${coinFrom.code} = ${rates.rate} ${coinTo.code}` : '---'}
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
            disabled={disabledProceed}
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
      ) : (
        <ErrorComponent
          exchangeData={exchangeData}
          setIsError={setIsError}
          setExchangeData={setExchangeData}
          setStep={setStep}
        />
      )}
    </>
  );
};

export default InitialStep;
