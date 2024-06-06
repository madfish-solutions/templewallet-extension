import React, { FC, memo } from 'react';

import clsx from 'clsx';

import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import TezosIconSrc from 'app/icons/networks/tezos.svg?url';

interface NetworkLogosProps {
  /** Single logo size in Tailwind units */
  size?: number;
}

export const TezosNetworkLogo = memo<NetworkLogosProps>(({ size = 6 }) => (
  <NetworkLogoBase size={size} src={TezosIconSrc} alt="Tezos" />
));

export const EvmNetworksLogos = memo<NetworkLogosProps>(({ size = 6 }) => (
  <div className="flex">
    <NetworkLogoBase size={size} src={OptimismIconSrc} alt="Optimism" />
    <NetworkLogoBase size={size} src={PolygonIconSrc} alt="Polygon" className="-ml-3.5" />
    <NetworkLogoBase size={size} src={BinanceSmartChainIconSrc} alt="BSC" className="-ml-3.5" />
    <NetworkLogoBase size={size} src={EthereumIconSrc} alt="ETH" className="-ml-3.5" />
  </div>
));

interface NetworkLogoBaseProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  size: number;
}

const NetworkLogoBase = memo<NetworkLogoBaseProps>(({ src, alt, className, style, size }) => (
  <img
    src={src}
    alt={alt}
    className={clsx(`w-${size} h-${size} p-0.5 border border-grey-4 bg-white rounded-full`, className)}
    style={style}
  />
));
