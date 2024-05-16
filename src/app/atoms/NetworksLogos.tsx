import React, { FC, memo } from 'react';

import clsx from 'clsx';

import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import TezosIconSrc from 'app/icons/networks/tezos.svg?url';

export const TezosNetworkLogo = memo(() => <NetworkLogoBase src={TezosIconSrc} alt="Tezos" />);

export const EvmNetworksLogos: FC = () => (
  <div className="flex">
    <NetworkLogoBase src={OptimismIconSrc} alt="Optimism" />
    <NetworkLogoBase src={PolygonIconSrc} alt="Polygon" className="-ml-3.5" />
    <NetworkLogoBase src={BinanceSmartChainIconSrc} alt="BSC" className="-ml-3.5" />
    <NetworkLogoBase src={EthereumIconSrc} alt="ETH" className="-ml-3.5" />
  </div>
);

interface NetworkLogoBaseProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const NetworkLogoBase = memo<NetworkLogoBaseProps>(({ src, alt, className, style }) => (
  <img
    src={src}
    alt={alt}
    width={24}
    height={24}
    className={clsx('p-0.5 border border-grey-4 bg-white rounded-full', className)}
    style={style}
  />
));
