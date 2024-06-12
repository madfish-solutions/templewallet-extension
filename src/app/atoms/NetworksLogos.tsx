import React, { FC, memo } from 'react';

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

type TezosNetworkLogoProps = Omit<NetworkLogoBaseProps, 'src' | 'alt'>;

export const TezosNetworkLogo = memo<TezosNetworkLogoProps>(props => (
  <NetworkLogoBase src={TezosIconSrc} alt="Tezos" {...props} />
));

export const EvmNetworksLogos: FC = () => (
  <div className="flex">
    <NetworkLogoBase src={OptimismIconSrc} alt="Optimism" />
    <NetworkLogoBase src={PolygonIconSrc} alt="Polygon" className="-ml-3.5" />
    <NetworkLogoBase src={BinanceSmartChainIconSrc} alt="BSC" className="-ml-3.5" />
    <NetworkLogoBase src={EthereumIconSrc} alt="ETH" className="-ml-3.5" />
  </div>
);

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
