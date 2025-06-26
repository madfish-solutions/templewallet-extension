import React, { memo, Suspense, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useBtcToUsdRateSelector, useTezUsdToTokenRateSelector } from 'app/store/currency/selectors';
import { useEthUsdToTokenRateSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useFiatCurrency, useFiatToUsdRate } from 'lib/fiat-currency';
import { TEZOS_METADATA } from 'lib/metadata';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

import Money from '../Money';

import { EquityCurrency } from './types';

const BTC_DECIMALS = 8;
const ETH_DECIMALS = 18;

const SYMBOL_STYLE = { marginLeft: `${4 / 24}em` };

interface TotalEquityForTezosOnlyProps {
  totalBalanceInDollar: string;
  targetCurrency: EquityCurrency;
}

export const TotalEquityBase = memo<TotalEquityForTezosOnlyProps>(({ totalBalanceInDollar, targetCurrency }) => {
  switch (targetCurrency) {
    case 'tez':
      return <InTez amountInDollar={totalBalanceInDollar} />;
    case 'btc':
      return <InBtc amountInDollar={totalBalanceInDollar} />;
    case 'eth':
      return <InEth amountInDollar={totalBalanceInDollar} />;
    default:
      return (
        <Suspense fallback={null}>
          <InFiat amountInDollar={totalBalanceInDollar} />
        </Suspense>
      );
  }
});

const InFiat = memo<{ amountInDollar: string }>(({ amountInDollar }) => {
  const {
    selectedFiatCurrency: { symbol: fiatSymbol }
  } = useFiatCurrency();

  const fiatToUsdRate = useFiatToUsdRate();

  const amountInFiat = useMemo(
    () => (isTruthy(fiatToUsdRate) ? new BigNumber(amountInDollar).times(fiatToUsdRate) : ZERO),
    [amountInDollar, fiatToUsdRate]
  );

  return (
    <>
      <Money smallFractionFont={false} fiat>
        {amountInFiat}
      </Money>
      <span style={SYMBOL_STYLE}>{fiatSymbol}</span>
    </>
  );
});

const InTez = memo<{ amountInDollar: string }>(({ amountInDollar }) => {
  const tezosToUsdRate = useTezUsdToTokenRateSelector();

  const amountInTez = useMemo(
    () =>
      isTruthy(tezosToUsdRate)
        ? new BigNumber(amountInDollar).dividedBy(tezosToUsdRate).decimalPlaces(TEZOS_METADATA.decimals)
        : ZERO,
    [amountInDollar, tezosToUsdRate]
  );

  return (
    <>
      <Money smallFractionFont={false}>{amountInTez || ZERO}</Money>
      <span style={SYMBOL_STYLE}>TEZ</span>
    </>
  );
});

const InBtc = memo<{ amountInDollar: string }>(({ amountInDollar }) => {
  const bitcoinToUsdRate = useBtcToUsdRateSelector();

  const amountInBtc = useMemo(
    () =>
      isTruthy(bitcoinToUsdRate)
        ? new BigNumber(amountInDollar).dividedBy(bitcoinToUsdRate).decimalPlaces(BTC_DECIMALS)
        : ZERO,
    [amountInDollar, bitcoinToUsdRate]
  );

  return (
    <>
      <Money smallFractionFont={false}>{amountInBtc || ZERO}</Money>
      <span style={SYMBOL_STYLE}>BTC</span>
    </>
  );
});

const InEth = memo<{ amountInDollar: string }>(({ amountInDollar }) => {
  const ethUsdTokenRates = useEthUsdToTokenRateSelector();

  const amountInEth = useMemo(
    () =>
      isTruthy(ethUsdTokenRates)
        ? new BigNumber(amountInDollar).dividedBy(ethUsdTokenRates).decimalPlaces(ETH_DECIMALS)
        : ZERO,
    [amountInDollar, ethUsdTokenRates]
  );

  return (
    <>
      <Money smallFractionFont={false}>{amountInEth || ZERO}</Money>
      <span style={SYMBOL_STYLE}>ETH</span>
    </>
  );
});
