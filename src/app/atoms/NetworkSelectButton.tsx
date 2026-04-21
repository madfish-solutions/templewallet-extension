import { ReactNode } from 'react';

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

export const NetworkSelectButton = ({ selectedChain, onClick }: NetworkSelectProps) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  let children: ReactNode;

  if (!selectedChain) {
    children = (
      <>
        <IconBase Icon={Browse} className="text-primary" />
        <span className="text-font-medium-bold">
          <T id="allNetworks" />
        </span>
      </>
    );
  } else if (selectedChain.kind === TempleChainKind.Tezos) {
    const networkName = tezosChains[selectedChain.chainId].name;

    children = (
      <>
        <TezosNetworkLogo chainId={selectedChain.chainId} />
        <span className="text-font-medium-bold">{networkName}</span>
      </>
    );
  } else {
    const networkName = evmChains[selectedChain.chainId].name;

    children = (
      <>
        <EvmNetworkLogo chainId={selectedChain.chainId} size={24} imgClassName="p-0.5" />
        <span className="text-font-medium-bold">{networkName}</span>
      </>
    );
  }

  return (
    <DropdownTriggerButton className="w-full p-3" onClick={onClick}>
      <div className="flex items-center gap-2">{children}</div>
    </DropdownTriggerButton>
  );
};
