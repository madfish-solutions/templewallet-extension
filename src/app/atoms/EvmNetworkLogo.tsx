import React, { CSSProperties, memo, useMemo } from 'react';

import clsx from 'clsx';

import BrowseSrc from 'app/icons/base/browse.svg?url';
import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import { getEvmNativeAssetIcon } from 'lib/images-uri';

const logosRecord: Record<number, string> = {
  1: EthereumIconSrc,
  56: BinanceSmartChainIconSrc,
  137: PolygonIconSrc,
  10: OptimismIconSrc
};

interface EvmNetworkLogoProps {
  chainId: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export const EvmNetworkLogo = memo<EvmNetworkLogoProps>(({ chainId, size = 24, className, style }) => {
  const source = useMemo(() => {
    if (logosRecord[chainId]) return logosRecord[chainId];

    const nativeAssetIcon = getEvmNativeAssetIcon(chainId, size * 2);

    if (nativeAssetIcon) return nativeAssetIcon;

    return BrowseSrc;
  }, [chainId, size]);

  return (
    <img
      src={source}
      alt={`Network icon of chainId: ${chainId}`}
      width={size}
      height={size}
      className={clsx('p-0.5 border border-grey-4 bg-white rounded-full', className)}
      style={style}
    />
  );
});
