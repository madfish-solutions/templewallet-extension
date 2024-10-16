import React, { memo, useMemo } from 'react';

import { IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { T } from 'lib/i18n';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

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
    <div
      className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">{children}</div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </div>
  );
});
