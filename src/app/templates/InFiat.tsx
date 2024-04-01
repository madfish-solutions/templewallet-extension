import React, { FC, ReactElement, ReactNode, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { TestIDProps } from 'lib/analytics';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { useTezosNetwork } from 'temple/front';

interface OutputProps {
  balance: ReactNode;
  symbol: string;
}

interface InFiatProps extends TestIDProps {
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
  showCents = true,
  testID,
  testIDProperties
}) => {
  const price = useAssetFiatCurrencyPrice(assetSlug ?? 'tez');
  const { selectedFiatCurrency } = useFiatCurrency();
  const { isMainnet } = useTezosNetwork();

  if (mainnet === undefined) {
    mainnet = isMainnet;
  }

  const roundedInFiat = useMemo(() => {
    if (!isDefined(price)) return new BigNumber(0);

    const inFiat = new BigNumber(volume).times(price);
    if (showCents) {
      return inFiat;
    }
    return inFiat.integerValue();
  }, [price, showCents, volume]);

  const cryptoDecimals = showCents ? undefined : 0;

  return mainnet && isDefined(price)
    ? children({
        balance: (
          <Money
            fiat={showCents}
            cryptoDecimals={cryptoDecimals}
            roundingMode={roundingMode}
            shortened={shortened}
            smallFractionFont={smallFractionFont}
            testID={testID}
            testIDProperties={testIDProperties}
          >
            {roundedInFiat}
          </Money>
        ),
        symbol: selectedFiatCurrency.symbol
      })
    : null;
};

export default InFiat;
