import { FC, Suspense } from 'react';

import { isDefined } from '@rnw-community/shared';
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

  if (targetCurrency === 'fiat') {
    return (
      <Suspense fallback={null}>
        <InFiat {...contentProps} />
      </Suspense>
    );
  }

  const Component = targetCryptoComponents[targetCurrency];

  return <Component {...contentProps} />;
};

interface TotalEquityContentProps {
  amountInDollar: string;
  tooltip?: boolean;
}

const TotalEquityOneCaseHOC = (
  useSymbol: () => string,
  useRate: () => string | number | nullish,
  isCrypto: boolean,
  decimalPlaces?: number
) => {
  function TotalEquityOneCase({ amountInDollar, tooltip }: TotalEquityContentProps) {
    const symbol = useSymbol();
    const rate = useRate();

    let amount: BigNumber;
    if (isTruthy(rate) && isCrypto) {
      amount = new BigNumber(amountInDollar).dividedBy(rate);
    } else if (isTruthy(rate)) {
      amount = new BigNumber(amountInDollar).times(rate);
    } else {
      amount = ZERO;
    }

    if (isDefined(decimalPlaces)) {
      amount = amount.decimalPlaces(decimalPlaces);
    }

    return (
      <>
        <Money smallFractionFont={false} fiat={!isCrypto} tooltip={tooltip}>
          {amount}
        </Money>
        <span style={SYMBOL_STYLE}>{symbol}</span>
      </>
    );
  }

  return TotalEquityOneCase;
};

const InFiat = TotalEquityOneCaseHOC(() => useFiatCurrency().selectedFiatCurrency.symbol, useFiatToUsdRate, false);

const InTez = TotalEquityOneCaseHOC(() => 'TEZ', useTezUsdToTokenRateSelector, true, TEZOS_METADATA.decimals);

const InBtc = TotalEquityOneCaseHOC(() => 'BTC', useBtcToUsdRateSelector, true, BTC_DECIMALS);

const InEth = TotalEquityOneCaseHOC(() => 'ETH', useEthUsdToTokenRateSelector, true, ETH_DECIMALS);

const targetCryptoComponents = { tez: InTez, btc: InBtc, eth: InEth };
