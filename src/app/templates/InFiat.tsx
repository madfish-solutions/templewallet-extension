import React, { FC, ReactElement, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { useNetwork } from 'lib/temple/front';

interface OutputProps {
  balance: ReactNode;
  symbol: string;
}

interface InFiatProps {
  volume: BigNumber | number | string;
  assetSlug?: string;
  children: (output: OutputProps) => ReactElement;
  roundingMode?: BigNumber.RoundingMode;
  shortened?: boolean;
  smallFractionFont?: boolean;
  mainnet?: boolean;
  showCents?: boolean;
}

const InFiat: FC<InFiatProps> = ({
  volume,
  assetSlug,
  children,
  roundingMode,
  shortened,
  smallFractionFont,
  mainnet,
  showCents = true
}) => {
  const price = useAssetFiatCurrencyPrice(assetSlug ?? 'tez');
  const { selectedFiatCurrency } = useFiatCurrency();
  const walletNetwork = useNetwork();

  if (mainnet === undefined) {
    mainnet = walletNetwork.type === 'main';
  }
  const roundedInFiat = useMemo(() => {
    if (price === null) {
      return new BigNumber(0);
    }
    const inFiat = new BigNumber(volume).times(price);
    if (showCents) {
      return inFiat;
    }
    return inFiat.integerValue();
  }, [price, showCents, volume]);

  const cryptoDecimals = showCents ? undefined : 0;

  return mainnet && price !== null
    ? children({
        balance: (
          <Money
            fiat={showCents}
            cryptoDecimals={cryptoDecimals}
            roundingMode={roundingMode}
            shortened={shortened}
            smallFractionFont={smallFractionFont}
          >
            {roundedInFiat}
          </Money>
        ),
        symbol: selectedFiatCurrency.symbol
      })
    : null;
};

export default InFiat;
