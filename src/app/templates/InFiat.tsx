import React, { FC, ReactElement, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-curency';
import { useNetwork } from 'lib/temple/front';

type InFiatProps = {
  volume: BigNumber | number | string;
  assetSlug?: string;
  children: (usdVolume: ReactNode) => ReactElement;
  roundingMode?: BigNumber.RoundingMode;
  shortened?: boolean;
  smallFractionFont?: boolean;
  mainnet?: boolean;
  showCents?: boolean;
};

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
    ? children(
        <Money
          fiat={showCents}
          cryptoDecimals={cryptoDecimals}
          roundingMode={roundingMode}
          shortened={shortened}
          smallFractionFont={smallFractionFont}
        >
          {roundedInFiat}
        </Money>
      )
    : null;
};

export default InFiat;
