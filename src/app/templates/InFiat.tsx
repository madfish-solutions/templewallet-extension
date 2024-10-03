import React, { FC, ReactElement, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { TestIDProps } from 'lib/analytics';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';

interface OutputProps {
  balance: ReactNode;
  symbol: string;
  noPrice: boolean;
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
  withSign?: boolean;
  evm?: boolean;
}

const InFiatDefault: FC<Props> = props => {
  // TODO: show fiat value only for mainnet chains
  if (!props.evm && props.chainId !== TEZOS_MAINNET_CHAIN_ID) return null;

  return <InFiat {...props} />;
};

export default InFiatDefault;

export const InFiat: FC<Props> = ({
  evm,
  chainId,
  volume,
  assetSlug,
  children,
  roundingMode,
  shortened,
  smallFractionFont,
  showCents = true,
  withSign,
  testID,
  testIDProperties
}) => {
  const price = useAssetFiatCurrencyPrice(assetSlug, chainId, evm);
  const { selectedFiatCurrency } = useFiatCurrency();

  const roundedInFiat = useMemo(() => {
    if (price.isZero()) return ZERO;

    const inFiat = new BigNumber(volume).times(price);
    if (showCents) {
      return inFiat;
    }

    return inFiat.integerValue();
  }, [price, showCents, volume]);

  const cryptoDecimals = showCents ? undefined : 0;

  return children({
    balance: (
      <Money
        fiat={showCents}
        cryptoDecimals={cryptoDecimals}
        roundingMode={roundingMode}
        shortened={shortened}
        smallFractionFont={smallFractionFont}
        withSign={withSign}
        testID={testID}
        testIDProperties={testIDProperties}
      >
        {roundedInFiat}
      </Money>
    ),
    symbol: selectedFiatCurrency.symbol,
    noPrice: price.isZero()
  });
};
