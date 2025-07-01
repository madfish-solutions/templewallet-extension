import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase, Size } from 'app/atoms/IconBase';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as StarFillIcon } from 'app/icons/starfill.svg';
import { isFilterChain } from 'app/pages/Swap/form/utils';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { T } from 'lib/i18n';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ALL_NETWORKS, FAVORITES } from './constants';
import { Network } from './types';

interface NetworkOptionProps {
  network: Network;
  activeNetwork: FilterChain | string;
  attractSelf: boolean;
  iconSize?: Size;
  onClick: EmptyFn;
}

function isChain(network: Network): network is OneOfChains {
  return typeof network !== 'string';
}

export const NetworkOption = memo<NetworkOptionProps>(
  ({ network, activeNetwork, attractSelf, iconSize = 24, onClick }) => {
    const isAllNetworks = typeof network === 'string' && network === ALL_NETWORKS;
    const isFavoritesOption = typeof network === 'string' && network === FAVORITES;

    const active = isAllNetworks
      ? activeNetwork === null
      : isChain(network) && isFilterChain(activeNetwork) && network.chainId === activeNetwork?.chainId;

    const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

    const Icon = useMemo(() => {
      if (isAllNetworks) return <IconBase Icon={Browse} className="text-primary" size={16} />;
      if (isFavoritesOption) return <StarFillIcon className="w-6 h-6" />;

      if (isChain(network)) {
        if (network.kind === TempleChainKind.Tezos)
          return <TezosNetworkLogo chainId={network.chainId} size={iconSize} />;

        if (network.kind === TempleChainKind.EVM)
          return <EvmNetworkLogo chainId={network.chainId} size={iconSize} imgClassName="p-0.5" />;
      }

      return null;
    }, [isAllNetworks, isFavoritesOption, network, iconSize]);

    const handleClick = useCallback(() => void (!active && onClick()), [active, onClick]);

    return (
      <div
        ref={elemRef}
        className={clsx(
          'flex justify-between items-center rounded-md p-2 text-font-description',
          active ? 'bg-grey-4' : 'cursor-pointer hover:bg-secondary-low'
        )}
        onClick={handleClick}
      >
        <span>
          {isAllNetworks ? (
            <T id={ALL_NETWORKS} />
          ) : isFavoritesOption ? (
            <T id={FAVORITES} />
          ) : isChain(network) ? (
            network.name
          ) : null}
        </span>
        {Icon}
      </div>
    );
  }
);
