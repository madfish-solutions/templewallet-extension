import React, { memo, useMemo } from 'react';

import { IconBase } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SelectedChain } from './SelectNetworkPage';

interface NetworkSelectProps {
  selectedChain: SelectedChain;
  onClick: EmptyFn;
}

export const NetworkSelect = memo<NetworkSelectProps>(({ selectedChain, onClick }) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  const children: JSX.Element = useMemo(() => {
    if (selectedChain.kind === TempleChainKind.Tezos) {
      const networkName = tezosChains[selectedChain.chainId].name;

      return (
        <>
          {selectedChain.chainId === TEZOS_MAINNET_CHAIN_ID ? (
            <TezosNetworkLogo size={24} />
          ) : (
            <NetworkLogoFallback networkName={networkName} />
          )}
          <span className="text-font-medium-bold">{networkName}</span>
        </>
      );
    }

    const networkName = evmChains[selectedChain.chainId].name;

    return (
      <>
        <EvmNetworkLogo networkName={networkName} chainId={selectedChain.chainId} size={24} imgClassName="p-0.5" />
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
