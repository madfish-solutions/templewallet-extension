import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase, Size } from 'app/atoms/IconBase';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { TempleChainKind } from 'temple/types';

import { ALL_NETWORKS } from './constants';
import { Network } from './types';

interface NetworkOptionProps {
  network: Network;
  activeNetwork: FilterChain;
  attractSelf: boolean;
  iconSize?: Size;
  onClick?: EmptyFn;
}

export const FilterOption = memo<NetworkOptionProps>(
  ({ network, activeNetwork, attractSelf, iconSize = 24, onClick }) => {
    const isAllNetworks = typeof network === 'string';

    const active = isAllNetworks ? activeNetwork === null : network.chainId === activeNetwork?.chainId;

    const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

    const Icon = useMemo(() => {
      if (isAllNetworks) return <IconBase Icon={Browse} className="text-primary" size={16} />;

      if (network.kind === TempleChainKind.Tezos) return <TezosNetworkLogo chainId={network.chainId} size={iconSize} />;

      if (network.kind === TempleChainKind.EVM)
        return <EvmNetworkLogo chainId={network.chainId} size={iconSize} imgClassName="p-0.5" />;

      return null;
    }, [isAllNetworks, network, iconSize]);

    const handleClick = useCallback(() => {
      if (active) return;

      onClick?.();
    }, [active, onClick]);

    return (
      <div
        ref={elemRef}
        className={clsx(
          'flex justify-between items-center rounded-md p-2 text-font-description',
          active ? 'bg-grey-4' : 'cursor-pointer hover:bg-secondary-low'
        )}
        onClick={handleClick}
      >
        <span>{isAllNetworks ? ALL_NETWORKS : network.name}</span>
        {Icon}
      </div>
    );
  }
);
