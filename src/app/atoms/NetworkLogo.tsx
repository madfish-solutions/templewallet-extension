import React, { CSSProperties, forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';

import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { Identicon } from './Identicon';
import { TezNetworkLogo } from './NetworksLogos';

const logosRecord: Record<number, string> = {
  1: EthereumIconSrc,
  56: BinanceSmartChainIconSrc,
  137: PolygonIconSrc,
  10: OptimismIconSrc
};

interface TezosNetworkLogoProps {
  networkName: string;
  chainId: string;
  size?: number;
  className?: string;
}

export const TezosNetworkLogo = memo<TezosNetworkLogoProps>(({ className, networkName, chainId, size = 16 }) =>
  chainId === TEZOS_MAINNET_CHAIN_ID ? (
    <TezNetworkLogo size={size} className={className} />
  ) : (
    <NetworkLogoFallback networkName={networkName} size={size} className={className} />
  )
);

interface EvmNetworkLogoProps {
  networkName: string;
  chainId: number;
  size?: number;
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
}

export const EvmNetworkLogo = memo(
  forwardRef<HTMLDivElement, EvmNetworkLogoProps>(
    ({ networkName, chainId, size = 16, className, imgClassName, style }, ref) => {
      const source = useMemo(() => {
        if (logosRecord[chainId]) return logosRecord[chainId];

        const nativeAssetIcon = getEvmNativeAssetIcon(chainId, size * 2);

        if (nativeAssetIcon) return nativeAssetIcon;

        return undefined;
      }, [chainId, size]);

      return (
        <div ref={ref} className={className}>
          {source ? (
            <img
              src={source}
              alt={networkName}
              width={size}
              height={size}
              className={clsx('border border-lines bg-white rounded-full', imgClassName)}
              style={style}
            />
          ) : (
            <NetworkLogoFallback networkName={networkName} size={size} />
          )}
        </div>
      );
    }
  )
);

interface NetworkLogoFallbackProps {
  networkName: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export const NetworkLogoFallback = memo<NetworkLogoFallbackProps>(({ networkName, size = 16, className, style }) => (
  <div
    style={{ width: size, height: size, padding: size * 0.0625, ...style }}
    className={clsx('flex justify-center items-center border border-grey-4 bg-white rounded-full', className)}
  >
    <Identicon
      type="initials"
      size={size}
      hash={networkName}
      options={{ chars: 1 }}
      className="flex justify-center items-center w-full h-full rounded-full"
    />
  </div>
));
