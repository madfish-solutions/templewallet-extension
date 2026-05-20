import { FC, Suspense } from 'react';

import BigNumber from 'bignumber.js';

import { EquityCurrency } from 'app/hooks/use-equity-currency';
import { useBtcToUsdRateSelector, useTezUsdToTokenRateSelector } from 'app/store/currency/selectors';
import { useEthUsdToTokenRateSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useFiatCurrency, useFiatToUsdRate } from 'lib/fiat-currency';
import { TEZOS_METADATA } from 'lib/metadata';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

import Money from '../Money';

const BTC_DECIMALS = 8;
const ETH_DECIMALS = 18;

const SYMBOL_STYLE = { marginLeft: `${4 / 24}em` };

interface TotalEquityForTezosOnlyProps {
  totalBalanceInDollar: string;
  targetCurrency: EquityCurrency;
  tooltip?: boolean;
}

export const TotalEquityBase: FC<TotalEquityForTezosOnlyProps> = ({
  totalBalanceInDollar,
  targetCurrency,
  tooltip
}) => {
  const contentProps = { amountInDollar: totalBalanceInDollar, tooltip };

  switch (targetCurrency) {
    case 'tez':
      return <InTez {...contentProps} />;
    case 'btc':
      return <InBtc {...contentProps} />;
    case 'eth':
      return <InEth {...contentProps} />;
    default:
      return (
        <Suspense fallback={null}>
          <InFiat {...contentProps} />
        </Suspense>
      );
  }
};

interface TotalEquityContentProps {
  amountInDollar: string;
  tooltip?: boolean;
}

const InFiat: FC<TotalEquityContentProps> = ({ amountInDollar, tooltip }) => {
  const {
    selectedFiatCurrency: { symbol: fiatSymbol }
  } = useFiatCurrency();

  const fiatToUsdRate = useFiatToUsdRate();

  const amountInFiat = isTruthy(fiatToUsdRate) ? new BigNumber(amountInDollar).times(fiatToUsdRate) : ZERO;

  return (
    <>
      <Money smallFractionFont={false} fiat tooltip={tooltip}>
        {amountInFiat}
      </Money>
      <span style={SYMBOL_STYLE}>{fiatSymbol}</span>
    </>
  );
};

const InTez: FC<TotalEquityContentProps> = ({ amountInDollar, tooltip }) => {
  const tezosToUsdRate = useTezUsdToTokenRateSelector();

  const amountInTez = isTruthy(tezosToUsdRate)
    ? new BigNumber(amountInDollar).dividedBy(tezosToUsdRate).decimalPlaces(TEZOS_METADATA.decimals)
    : ZERO;

  return (
    <>
      <Money smallFractionFont={false} tooltip={tooltip}>
        {amountInTez || ZERO}
      </Money>
      <span style={SYMBOL_STYLE}>TEZ</span>
    </>
  );
};

const InBtc: FC<TotalEquityContentProps> = ({ amountInDollar, tooltip }) => {
  const bitcoinToUsdRate = useBtcToUsdRateSelector();

  const amountInBtc = isTruthy(bitcoinToUsdRate)
    ? new BigNumber(amountInDollar).dividedBy(bitcoinToUsdRate).decimalPlaces(BTC_DECIMALS)
    : ZERO;

  return (
    <>
      <Money smallFractionFont={false} tooltip={tooltip}>
        {amountInBtc || ZERO}
      </Money>
      <span style={SYMBOL_STYLE}>BTC</span>
    </>
  );
};

const InEth: FC<TotalEquityContentProps> = ({ amountInDollar, tooltip }) => {
  const ethUsdTokenRates = useEthUsdToTokenRateSelector();

  const amountInEth = isTruthy(ethUsdTokenRates)
    ? new BigNumber(amountInDollar).dividedBy(ethUsdTokenRates).decimalPlaces(ETH_DECIMALS)
    : ZERO;

  return (
    <>
      <Money smallFractionFont={false} tooltip={tooltip}>
        {amountInEth || ZERO}
      </Money>
      <span style={SYMBOL_STYLE}>ETH</span>
    </>
  );
};
