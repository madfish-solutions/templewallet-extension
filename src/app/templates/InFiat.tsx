import React, { FC, ReactElement, ReactNode, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { TestIDProps } from 'lib/analytics';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

interface OutputProps {
  balance: ReactNode;
  symbol: string;
}

interface Props extends TestIDProps {
  volume: BigNumber | number | string;
  chainId: number | string;
  assetSlug: string;
  children: (output: OutputProps) => ReactElement;
  roundingMode?: BigNumber.RoundingMode;
  shortened?: boolean;
  smallFractionFont?: boolean;
  showCents?: boolean;
  evm?: boolean;
}

const InFiat: FC<Props> = props => {
  if (!props.evm && props.chainId !== TEZOS_MAINNET_CHAIN_ID) return null;

  return <InFiatContent {...props} />;
};

export default InFiat;

const InFiatContent: FC<Props> = ({
  evm,
  chainId,
  volume,
  assetSlug,
  children,
  roundingMode,
  shortened,
  smallFractionFont,
  showCents = true,
  testID,
  testIDProperties
}) => {
  const price = useAssetFiatCurrencyPrice(assetSlug, chainId, evm);
  const { selectedFiatCurrency } = useFiatCurrency();

  const roundedInFiat = useMemo(() => {
    if (!isDefined(price)) return new BigNumber(0);

    const inFiat = new BigNumber(volume).times(price);
    if (showCents) {
      return inFiat;
    }
    return inFiat.integerValue();
  }, [price, showCents, volume]);

  const cryptoDecimals = showCents ? undefined : 0;

  return isDefined(price)
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
