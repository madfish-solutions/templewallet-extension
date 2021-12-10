import React, { ChangeEvent, FC } from 'react';

import { Modifier } from '@popperjs/core';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import useSWR from 'swr';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner';
import styles from 'app/pages/BuyCrypto/BuyCrypto.module.css';
import CurrencyComponent from 'app/pages/BuyCrypto/CurrencyComponent';
import { getCurrencies, getRateDataInterface } from 'lib/exolix-api';
import { T } from 'lib/i18n/react';
import Popper from 'lib/ui/Popper';

interface Props {
  type: string;
  coin: string;
  setCoin?: (coin: string) => void;
  onChangeInputHandler?: (value: ChangeEvent<HTMLInputElement>) => void;
  value?: number;
  amount?: number;
  lastMinAmount?: BigNumber;
  readOnly?: boolean;
  rates?: getRateDataInterface;
  maxAmount?: string;
  isMaxAmountError?: boolean;
  isCurrencyAvailable?: boolean;
}

const numbersAndDotRegExp = /^\d*\.?\d*$/;

const coinList = [
  'BTC',
  'LTC',
  'DOGE',
  'XMR',
  'ETH',
  'AR',
  'SOL',
  'MATIC',
  'DOT',
  'KSM',
  'USDT',
  'UNI',
  '1INCH',
  'CRV',
  'COMP',
  'MKR',
  'RENBTC',
  'YFI',
  'LINK',
  'SHIB',
  'XVS',
  'CAKE',
  'QUICK',
  'LUNA',
  'ATOM',
  'SUSHI',
  'CELO',
  'AVAX',
  'AXS',
  'EPS',
  'EOS',
  'FTM',
  'FLOW',
  'KAVA',
  'KSM',
  'NEAR',
  'sUSD',
  'USDTERC20',
  'USDTBSC'
];

const sameWidth: Modifier<string, any> = {
  name: 'sameWidth',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width + 80}px`;
    state.styles.popper.left = '-5px';
  }
};

const BuyCryptoInput: FC<Props> = ({
  type,
  coin,
  setCoin = () => void 0,
  value,
  readOnly = false,
  amount,
  lastMinAmount,
  onChangeInputHandler,
  rates = { destination_amount: 0, rate: 0, min_amount: '0' },
  maxAmount,
  isMaxAmountError,
  isCurrencyAvailable
}) => {
  const isCoinFromType = type === 'coinFrom';
  return (
    <>
      <SendOrGet
        amount={amount}
        lastMinAmount={lastMinAmount}
        isCoinFromType={isCoinFromType}
        coin={coin}
        rateAmount={rates!.min_amount}
      />
      <BaseInputComponent
        isCoinFromType={isCoinFromType}
        coin={coin}
        readOnly={readOnly}
        value={value}
        onChangeInputHandler={onChangeInputHandler}
        setCoin={setCoin}
      />
      <MinMaxComponent
        isCoinFromType={isCoinFromType}
        coin={coin}
        maxAmount={maxAmount}
        isMaxAmountError={isMaxAmountError}
        isCurrencyAvailable={isCurrencyAvailable}
      />
    </>
  );
};

export default BuyCryptoInput;

interface SendOrGetProps {
  lastMinAmount?: BigNumber;
  amount?: number;
  isCoinFromType: boolean;
  coin: string;
  rateAmount: string;
}

const SendOrGet: React.FC<SendOrGetProps> = ({ amount, lastMinAmount, isCoinFromType, coin, rateAmount }) => {
  const isMinAmountError = amount !== 0 && (lastMinAmount ? lastMinAmount.toNumber() : 0) > Number(amount);
  const minAmountClassName1 = isMinAmountError ? 'text-red-700' : 'text-gray-500';
  const minAmountClassName2 = isMinAmountError ? 'text-red-700' : 'text-gray-700';
  return (
    <div className={styles['titleWrapper']}>
      <p className={styles['titleLeft']}>{isCoinFromType ? 'Send' : 'Get'}</p>
      <p className={classNames(minAmountClassName1)}>
        {isCoinFromType ? (
          <>
            <T id={'min'} />
            <span className={classNames(minAmountClassName2, 'text-sm')}> {rateAmount}</span>{' '}
            <span className={classNames(minAmountClassName2, 'text-xs')}>{coin}</span>
          </>
        ) : null}
      </p>
    </div>
  );
};

interface BaseInputComponentProps {
  isCoinFromType: boolean;
  coin: string;
  readOnly: boolean;
  value?: number;
  onChangeInputHandler?: (value: ChangeEvent<HTMLInputElement>) => void;
  setCoin?: (coin: string) => void;
}

const BaseInputComponent: React.FC<BaseInputComponentProps> = ({
  isCoinFromType,
  coin,
  readOnly = false,
  value,
  onChangeInputHandler,
  setCoin = () => void 0
}) => {
  const { data: currencies = [], isValidating: isCurrenciesLoaded } = useSWR(['/api/currency'], getCurrencies);

  const filteredCurrencies = currencies.filter(currency => currency.status === 1 && coinList.includes(currency.code));
  return (
    <div className={styles['inputWrapper']}>
      <div className={styles['currencyBlock']}>
        {isCoinFromType ? (
          <Popper
            placement="bottom-start"
            strategy="fixed"
            modifiers={[sameWidth]}
            fallbackPlacementsEnabled={false}
            popup={({ opened, setOpened }) => (
              <DropdownWrapper
                opened={opened}
                className="origin-top overflow-x-hidden overflow-y-auto"
                style={{
                  maxHeight: '15.75rem',
                  backgroundColor: 'white',
                  borderColor: '#e2e8f0',
                  padding: 0
                }}
              >
                {isCurrenciesLoaded ? (
                  <Spinner theme="primary" style={{ width: '3rem' }} />
                ) : (
                  filteredCurrencies.map(currency => (
                    <CurrencyComponent
                      type="currencyDropdown"
                      key={currency.code}
                      label={currency.code}
                      className={currency.code === coin ? styles.selected : ''}
                      onPress={() => {
                        setCoin(currency.code);
                        setOpened(false);
                      }}
                    />
                  ))
                )}
              </DropdownWrapper>
            )}
          >
            {({ ref, toggleOpened }) => (
              <CurrencyComponent
                type="currencySelector"
                label={coin}
                short
                ref={ref as unknown as React.RefObject<HTMLDivElement>}
                onPress={toggleOpened}
              />
            )}
          </Popper>
        ) : (
          <CurrencyComponent type="tezosSelector" label={coin} />
        )}
      </div>
      <div className={styles['amountInputContainer']}>
        <input
          readOnly={readOnly}
          onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
            const inputValue = (event.target as unknown as HTMLInputElement).value;
            if (inputValue.indexOf('0') !== -1 && inputValue.length === 1 && event.key === '0') {
              event.preventDefault();
            }
            if (inputValue.indexOf('.') !== -1 && event.key === '.') {
              event.preventDefault();
            }
            if (!numbersAndDotRegExp.test(event.key)) {
              event.preventDefault();
            }
          }}
          value={value}
          placeholder="0.00"
          className={classNames([[styles['amountInput'], 'pr-1']])}
          type="text"
          maxLength={15}
          onChange={onChangeInputHandler}
        />
      </div>
    </div>
  );
};

interface MinMaxComponentProps {
  isCoinFromType: boolean;
  coin: string;
  maxAmount?: string;
  isMaxAmountError?: boolean;
  isCurrencyAvailable?: boolean;
}

const MinMaxComponent: React.FC<MinMaxComponentProps> = ({
  isCoinFromType,
  coin,
  maxAmount,
  isMaxAmountError,
  isCurrencyAvailable
}) => {
  const maxAmountClassName = isMaxAmountError ? 'text-red-700' : 'text-gray-500';
  return (
    <div className={styles['titleWrapper']} style={{ justifyContent: 'flex-end' }}>
      <p className={classNames(maxAmountClassName)}>
        {isCoinFromType && (
          <InnerMax
            isCurrencyAvailable={isCurrencyAvailable}
            isMaxAmountError={isMaxAmountError}
            coin={coin}
            maxAmount={maxAmount}
          />
        )}
      </p>
    </div>
  );
};

interface InnerMaxProps {
  coin: string;
  maxAmount?: string;
  isMaxAmountError?: boolean;
  isCurrencyAvailable?: boolean;
}

const InnerMax: React.FC<InnerMaxProps> = ({ coin, maxAmount, isMaxAmountError, isCurrencyAvailable }) => {
  const maxAmountClassName = isMaxAmountError ? 'text-red-700' : 'text-gray-700';
  const trueMaxAmount = maxAmount !== 'Infinity' ? maxAmount : '0';
  return isCurrencyAvailable ? (
    <>
      <T id={'max'} />
      <span className={classNames(maxAmountClassName, 'text-sm')}> {trueMaxAmount}</span>{' '}
      <span className={classNames(maxAmountClassName, 'text-xs')}>{coin}</span>
    </>
  ) : (
    <span className="text-red-700">
      <T id={'currencyUnavailable'} />
    </span>
  );
};
