import React, { memo, useMemo } from 'react';

import { IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { T } from 'lib/i18n';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { DropdownTriggerButton } from './dropdown-trigger-button';

interface NetworkSelectProps {
  selectedChain: FilterChain;
  onClick: EmptyFn;
}

export const NetworkSelectButton = memo<NetworkSelectProps>(({ selectedChain, onClick }) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  const children: JSX.Element = useMemo(() => {
    if (!selectedChain) {
      return (
        <>
          <IconBase Icon={Browse} className="text-primary" size={16} />
          <span className="text-font-medium-bold">
            <T id="allNetworks" />
          </span>
        </>
      );
    }

    if (selectedChain.kind === TempleChainKind.Tezos) {
      const networkName = tezosChains[selectedChain.chainId].name;

      return (
        <>
          <TezosNetworkLogo chainId={selectedChain.chainId} />
          <span className="text-font-medium-bold">{networkName}</span>
        </>
      );
    }

    const networkName = evmChains[selectedChain.chainId].name;

    return (
      <>
        <EvmNetworkLogo chainId={selectedChain.chainId} size={24} imgClassName="p-0.5" />
        <span className="text-font-medium-bold">{networkName}</span>
      </>
    );
  }, [selectedChain, evmChains, tezosChains]);

  return (
    <DropdownTriggerButton className="p-3 w-full" onClick={onClick}>
      <div className="flex items-center gap-2">{children}</div>
    </DropdownTriggerButton>
  );
});
