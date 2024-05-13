import React, { FC, memo } from 'react';

import clsx from 'clsx';

import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import TezosIconSrc from 'app/icons/networks/tezos.svg?url';

export const TezosNetworkLogo = memo(() => <NetworkLogoBase src={TezosIconSrc} alt="Tezos" className="bg-white" />);

export const EvmNetworksLogos: FC = () => (
  <div className="flex">
    <NetworkLogoBase src={OptimismIconSrc} alt="Optimism" className="bg-white" />
    <NetworkLogoBase src={PolygonIconSrc} alt="Polygon" className="bg-white" style={SHIFTED_LOGO_STYLE} />
    <NetworkLogoBase src={BinanceSmartChainIconSrc} alt="BSC" className="bg-white" style={SHIFTED_LOGO_STYLE} />
    <NetworkLogoBase src={EthereumIconSrc} alt="ETH" className="bg-white" style={SHIFTED_LOGO_STYLE} />
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
    className={clsx('p-0.5 border border-grey-4 rounded-full', className)}
    style={style}
  />
));

const SHIFTED_LOGO_STYLE: React.CSSProperties = {
  marginLeft: '-14px'
};
