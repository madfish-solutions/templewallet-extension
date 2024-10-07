import React, { CSSProperties, FC, memo, useMemo } from 'react';

import clsx from 'clsx';
import type { Placement } from 'tippy.js';

import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import { t } from 'lib/i18n';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';
import { useTezosChainByChainId } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { Identicon } from './Identicon';
import { TezNetworkLogo } from './NetworksLogos';

const logosRecord: Record<number, string> = {
  1: EthereumIconSrc,
  56: BinanceSmartChainIconSrc,
  137: PolygonIconSrc,
  10: OptimismIconSrc
};

interface TezosNetworkLogoProps {
  chainId: string;
  size?: number;
}

export const TezosNetworkLogo = memo<TezosNetworkLogoProps>(({ chainId, size = 24 }) =>
  chainId === TEZOS_MAINNET_CHAIN_ID ? (
    <TezNetworkLogo size={size} />
  ) : (
    <TezosNetworkLogoFallback chainId={chainId} size={size} />
  )
);

export const TezosNetworkLogoFallback = memo<TezosNetworkLogoProps>(({ chainId, size = 24 }) => {
  const chain = useTezosChainByChainId(chainId);
  const networkName = useMemo(() => (chain?.nameI18nKey ? t(chain.nameI18nKey) : chain?.name || ''), [chain]);

  return <NetworkLogoFallback networkName={networkName} size={size} />;
});

interface EvmNetworkLogoProps {
  chainId: number;
  size?: number;
  imgClassName?: string;
  style?: CSSProperties;
}

export const EvmNetworkLogo = memo<EvmNetworkLogoProps>(({ chainId, size = 24, imgClassName, style }) => {
  const source = useMemo(() => logosRecord[chainId] || getEvmNativeAssetIcon(chainId, size * 2), [chainId, size]);

  const chain = useEvmChainByChainId(chainId);
  const networkName = useMemo(() => (chain?.nameI18nKey ? t(chain.nameI18nKey) : chain?.name || ''), [chain]);

  return source ? (
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
  );
});

const IDENTICON_OPTS = { chars: 1 };

interface NetworkLogoFallbackProps {
  networkName: string;
  size?: number;
  className?: string;
}

const NetworkLogoFallback = memo<NetworkLogoFallbackProps>(({ networkName, size = 24, className }) => (
  <div
    style={{ width: size, height: size }}
    className={clsx('p-px border border-grey-4 bg-white rounded-full overflow-hidden', className)}
  >
    <div className="w-full h-full flex justify-center items-center rounded-full overflow-hidden">
      <Identicon type="initials" hash={networkName} size={size * 2} options={IDENTICON_OPTS} className="shrink-0" />
    </div>
  </div>
));

interface NetworkLogoTooltipWrapProps {
  networkName: string;
  className?: string;
  placement?: Placement;
}

export const NetworkLogoTooltipWrap: FC<PropsWithChildren<NetworkLogoTooltipWrapProps>> = ({
  className,
  networkName,
  placement = 'bottom-start',
  children
}) => {
  const tippyProps = useMemo<UseTippyOptions>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: networkName ?? 'Unknown Network',
      animation: 'shift-away-subtle',
      placement
    }),
    [networkName, placement]
  );

  const networkIconRef = useTippy<HTMLDivElement>(tippyProps);

  return (
    <div ref={networkIconRef} className={className}>
      {children}
    </div>
  );
};
