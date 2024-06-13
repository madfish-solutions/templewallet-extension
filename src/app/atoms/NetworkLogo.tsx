import React, { CSSProperties, memo, useMemo } from 'react';

import clsx from 'clsx';

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
  networkName: string;
  chainId: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export const EvmNetworkLogo = memo<EvmNetworkLogoProps>(({ networkName, chainId, size = 24, className, style }) => {
  const source = useMemo(() => {
    if (logosRecord[chainId]) return logosRecord[chainId];

    const nativeAssetIcon = getEvmNativeAssetIcon(chainId, size * 2);

    if (nativeAssetIcon) return nativeAssetIcon;

    return undefined;
  }, [chainId, size]);

  return source ? (
    <img
      src={source}
      alt={networkName}
      width={size}
      height={size}
      className={clsx('p-0.5 border border-grey-4 bg-white rounded-full', className)}
      style={style}
    />
  ) : (
    <NetworkLogoFallback networkName={networkName} size={size} />
  );
});

const ICON_PADDING = 10;

interface NetworkLogoFallbackProps {
  networkName: string;
  size?: number;
  className?: string;
}

export const NetworkLogoFallback = memo<NetworkLogoFallbackProps>(({ networkName, size = 24, className }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={clsx('flex justify-center items-center p-0.5 border border-grey-4 bg-white rounded-full', className)}
    >
      <div
        style={{ width: size - ICON_PADDING, height: size - ICON_PADDING }}
        className="flex justify-center items-center bg-grey-1 rounded-full"
      >
        <span className="text-white text-font-medium-bold">{networkName[0]}</span>
      </div>
    </div>
  );
});
