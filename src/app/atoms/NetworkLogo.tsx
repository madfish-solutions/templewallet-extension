import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';
import type { Placement } from 'tippy.js';

import ArbitrumIconSrc from 'app/icons/networks/arbitrum.svg?url';
import AvalancheIconSrc from 'app/icons/networks/avalanche.svg?url';
import BaseIconSrc from 'app/icons/networks/base.svg?url';
import BinanceSmartChainIconSrc from 'app/icons/networks/bsc.svg?url';
import EthereumIconSrc from 'app/icons/networks/ethereum.svg?url';
import OptimismIconSrc from 'app/icons/networks/optimism.svg?url';
import PolygonIconSrc from 'app/icons/networks/polygon.svg?url';
import { t } from 'lib/i18n';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { ETHEREUM_MAINNET_CHAIN_ID, COMMON_MAINNET_CHAIN_IDS, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ImageStacked } from 'lib/ui/ImageStacked';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';
import { isTruthy } from 'lib/utils';
import { useTezosChainByChainId } from 'temple/front';
import { ChainId, useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { IdenticonInitials } from './Identicon';
import { TezNetworkLogo } from './NetworksLogos';

const logosRecord: Record<number, string> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: EthereumIconSrc,
  [COMMON_MAINNET_CHAIN_IDS.bsc]: BinanceSmartChainIconSrc,
  [COMMON_MAINNET_CHAIN_IDS.polygon]: PolygonIconSrc,
  [COMMON_MAINNET_CHAIN_IDS.optimism]: OptimismIconSrc,
  [COMMON_MAINNET_CHAIN_IDS.base]: BaseIconSrc,
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: AvalancheIconSrc,
  [COMMON_MAINNET_CHAIN_IDS.arbitrum]: ArbitrumIconSrc
};

export interface NetworkLogoPropsBase<T extends TempleChainKind> {
  chainId: ChainId<T>;
  size?: number;
  className?: string;
  withTooltip?: boolean;
  tooltipPlacement?: Placement;
}

export const TezosNetworkLogo = memo<NetworkLogoPropsBase<TempleChainKind.Tezos>>(
  ({ chainId, size = 24, className, withTooltip, tooltipPlacement }) => {
    const chain = useTezosChainByChainId(chainId);
    const networkName = useMemo(() => (chain?.nameI18nKey ? t(chain.nameI18nKey) : chain?.name), [chain]);

    const withoutTooltipClassName = withTooltip ? undefined : className;

    const logoJsx =
      chainId === TEZOS_MAINNET_CHAIN_ID ? (
        <TezNetworkLogo size={size} className={withoutTooltipClassName} />
      ) : (
        <NetworkLogoFallback networkName={networkName} size={size} className={withoutTooltipClassName} />
      );

    return withTooltip ? (
      <WithTooltipWrap title={networkName ?? 'Unknown Network'} className={className} placement={tooltipPlacement}>
        {logoJsx}
      </WithTooltipWrap>
    ) : (
      logoJsx
    );
  }
);

interface EvmNetworkLogoProps extends NetworkLogoPropsBase<TempleChainKind.EVM> {
  chainName?: string;
  imgClassName?: string;
}

export const EvmNetworkLogo = memo<EvmNetworkLogoProps>(
  ({ chainId, size = 24, chainName, className, imgClassName, withTooltip, tooltipPlacement }) => {
    const sources = useMemo(() => {
      const doubleSize = size * 2;

      return [
        logosRecord[chainId],
        getEvmNativeAssetIcon(chainId, doubleSize, 'llamao'),
        getEvmNativeAssetIcon(chainId, doubleSize)
      ].filter(isTruthy);
    }, [chainId, size]);

    const chain = useEvmChainByChainId(chainId);
    const networkName = useMemo(
      () => chainName || (chain?.nameI18nKey ? t(chain.nameI18nKey) : chain?.name),
      [chainName, chain]
    );

    const withoutTooltipClassName = withTooltip ? undefined : className;

    const fallback = useMemo(
      () => <NetworkLogoFallback networkName={networkName} size={size} className={withoutTooltipClassName} />,
      [networkName, size, withoutTooltipClassName]
    );

    const logoJsx = (
      <ImageStacked
        sources={sources}
        alt={networkName}
        width={size}
        height={size}
        loader={fallback}
        fallback={fallback}
        className={clsx('border border-lines bg-white rounded-full', withoutTooltipClassName, imgClassName)}
      />
    );

    return withTooltip ? (
      <WithTooltipWrap title={networkName} className={className} placement={tooltipPlacement}>
        {logoJsx}
      </WithTooltipWrap>
    ) : (
      logoJsx
    );
  }
);
interface NetworkLogoFallbackProps {
  networkName?: string;
  size?: number;
  className?: string;
}

const NetworkLogoFallback = memo<NetworkLogoFallbackProps>(({ networkName, size = 24, className }) => (
  <div
    style={{ width: size, height: size }}
    className={clsx('p-px border border-grey-4 bg-white rounded-full overflow-hidden', className)}
  >
    <IdenticonInitials value={networkName?.at(0) ?? '?'} className="w-full h-full rounded-full" />
  </div>
));

interface WithTooltipWrapProps {
  title?: string;
  className?: string;
  placement?: Placement;
}

const WithTooltipWrap: FC<PropsWithChildren<WithTooltipWrapProps>> = ({
  className,
  title,
  placement = 'bottom-start',
  children
}) => {
  const tippyProps = useMemo<UseTippyOptions>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: title ?? 'Unknown Network',
      animation: 'shift-away-subtle',
      placement
    }),
    [title, placement]
  );

  const networkIconRef = useTippy<HTMLDivElement>(tippyProps);

  return (
    <div ref={networkIconRef} className={className}>
      {children}
    </div>
  );
};
