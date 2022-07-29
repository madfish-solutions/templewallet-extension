import React, { ChangeEvent, FC } from 'react';

import { Modifier } from '@popperjs/core';
import classNames from 'clsx';
import useSWR from 'swr';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { getCurrencies, GetRateData } from 'lib/exolix-api';
import { T } from 'lib/i18n/react';
import Popper from 'lib/ui/Popper';

import { CurrencyComponent } from './CurrencyComponent';

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

interface Props {
  type: string;
  currency: string;
  setCurrency?: (coin: string) => void;
  onChangeInputHandler?: (value: ChangeEvent<HTMLInputElement>) => void;
  value?: number;
  readOnly?: boolean;
  rates?: GetRateData;
  minAmount?: string;
  maxAmount?: string;
  isMinAmountError?: boolean;
  isMaxAmountError?: boolean;
  isCurrencyAvailable?: boolean;
}

const COIN_LIST_REFETCH_INTERVAL = 3600000;

export const TopUpInput: FC<Props> = ({
  type,
  currency,
  setCurrency = () => void 0,
  value,
  readOnly = false,
  onChangeInputHandler,
  rates = { toAmount: 0, rate: 0, minAmount: '0' },
  minAmount,
  maxAmount,
  isMinAmountError,
  isMaxAmountError,
  isCurrencyAvailable
}) => {
  const isFiatType = type === 'fiat';
  const isCoinFromType = type === 'coinFrom';
  const { data, isValidating: isCurrenciesLoaded } = useSWR(['/api/currency'], getCurrencies, {
    dedupingInterval: COIN_LIST_REFETCH_INTERVAL
  });

  const currencies = data ?? [];

  const filteredCurrencies = currencies.filter(currency => coinList.includes(currency.code));
  const minAmountErrorClassName = getBigErrorText(isMinAmountError);
  const maxAmountErrorClassName = getBigErrorText(isMaxAmountError);
  return (
    <>
      <div className="flex justify-between items-baseline">
        {!isFiatType && (
          <p className="font-inter" style={{ fontSize: 19, color: '#1b262c' }}>
            {isCoinFromType ? 'Send' : 'Get'}
          </p>
        )}
        <p className={classNames(getSmallErrorText(isMinAmountError))}>
          {isCoinFromType || isFiatType ? (
            <>
              <T id="min" />
              <span className={classNames(minAmountErrorClassName, 'text-sm')}>
                {' '}
                {minAmount ? minAmount : rates.minAmount}
              </span>{' '}
              <span className={classNames(minAmountErrorClassName, 'text-xs')}>{currency}</span>
            </>
          ) : null}
        </p>
        {isFiatType && maxAmount && (
          <p className={classNames(getSmallErrorText(isMaxAmountError))}>
            <T id="max" />
            {': '}
            <span className={classNames(maxAmountErrorClassName, 'text-sm')}>{maxAmount}</span>{' '}
            <span className={classNames(maxAmountErrorClassName, 'text-xs')}>{currency}</span>
          </p>
        )}
      </div>
      <div
        className="flex box-border w-full border-solid border-gray-300"
        style={{ borderWidth: 1, borderRadius: 6, height: 72 }}
      >
        <div
          className="flex justify-center items-center border-solid border-gray-300"
          style={{ borderRightWidth: 1, width: isFiatType ? 111 : 120 }}
        >
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
                    filteredCurrencies.map(currencyItem => (
                      <CurrencyComponent
                        type="currencyDropdown"
                        key={currencyItem.code}
                        label={currencyItem.code}
                        className={classNames(
                          'hover:bg-gray-200 cursor-pointer',
                          currencyItem.code === currency ? 'font-semibold' : ''
                        )}
                        onPress={() => {
                          setCurrency(currencyItem.code);
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
                  type="coinSelector"
                  label={currency}
                  short
                  ref={ref as unknown as React.RefObject<HTMLDivElement>}
                  onPress={toggleOpened}
                />
              )}
            </Popper>
          ) : (
            <CurrencyComponent type={isFiatType ? 'fiatSelector' : 'tezosSelector'} label={currency} />
          )}
        </div>
        <div className="flex flex-1">
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
            className="w-full font-inter text-right pr-1"
            style={{ fontSize: 23, borderRadius: 6 }}
            type="text"
            maxLength={15}
            onChange={onChangeInputHandler}
          />
        </div>
      </div>
      {isCoinFromType && (
        <MaxAmountErrorComponent
          isMaxAmountError={isMaxAmountError}
          isCurrencyAvailable={isCurrencyAvailable}
          maxAmount={maxAmount}
          coin={currency}
        />
      )}
    </>
  );
};

interface MaxAmountErrorComponentProps {
  isMaxAmountError?: boolean;
  isCurrencyAvailable?: boolean;
  maxAmount?: string;
  coin: string;
}

const MaxAmountErrorComponent: React.FC<MaxAmountErrorComponentProps> = ({
  isMaxAmountError,
  isCurrencyAvailable,
  maxAmount,
  coin
}) => {
  const maxAmountErrorText = getBigErrorText(isMaxAmountError);
  return (
    <div className="flex justify-end items-baseline">
      <p className={classNames(getSmallErrorText(isMaxAmountError))}>
        <CurrencyText
          className={maxAmountErrorText}
          coin={coin}
          maxAmount={maxAmount}
          isCurrencyAvailable={isCurrencyAvailable}
        />
      </p>
    </div>
  );
};

const CurrencyText: React.FC<
  Omit<MaxAmountErrorComponentProps, 'isCoinFromType' | 'isMaxAmountError'> & { className: string }
> = ({ isCurrencyAvailable, className, coin, maxAmount }) =>
  isCurrencyAvailable ? (
    <>
      <T id={'max'} />
      {':'}
      <span className={classNames(className, 'text-sm')}> {maxAmount !== 'Infinity' ? maxAmount : '0'}</span>{' '}
      <span className={classNames(className, 'text-xs')}>{coin}</span>
    </>
  ) : (
    <span className="text-red-700">
      <T id={'currencyUnavailable'} />
    </span>
  );

const getSmallErrorText = (flag?: boolean) => (flag ? 'text-red-700' : 'text-gray-500');
const getBigErrorText = (flag?: boolean) => (flag ? 'text-red-700' : 'text-gray-700');
