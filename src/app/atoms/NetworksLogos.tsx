import React, { memo } from 'react';

import clsx from 'clsx';

import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import TezosIconSrc from 'app/icons/networks/tezos.svg?url';

interface NetworkLogoBaseProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

type NetworkLogoProps = Omit<NetworkLogoBaseProps, 'src' | 'alt'>;

export const TezNetworkLogo = memo<NetworkLogoProps>(props => (
  <NetworkLogoBase src={TezosIconSrc} alt="Tezos" {...props} />
));

const networksLogosPropsPart = [
  { src: OptimismIconSrc, alt: 'Optimism' },
  { src: PolygonIconSrc, alt: 'Polygon' },
  { src: BinanceSmartChainIconSrc, alt: 'BSC' },
  { src: EthereumIconSrc, alt: 'ETH' }
];

export const EvmNetworksLogos = memo<NetworkLogoProps>(({ size = 24 }) => (
  <div className="flex">
    {networksLogosPropsPart.map(({ src, alt }, index) => (
      <NetworkLogoBase
        key={alt}
        size={size}
        src={src}
        alt={alt}
        style={{ marginLeft: index > 0 ? (-7 * size) / 12 : 0 }}
      />
    ))}
  </div>
));

const NetworkLogoBase = memo<NetworkLogoBaseProps>(({ src, alt, size = 24, className, style }) => (
  <img
    src={src}
    alt={alt}
    width={size}
    height={size}
    className={clsx('p-0.5 border border-grey-4 bg-white rounded-full', className)}
    style={style}
  />
));
