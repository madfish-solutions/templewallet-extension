import React, { FC, useMemo, useState } from 'react';

import { StayActiveIconButton } from 'app/atoms/IconButton';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { RadioButton } from 'app/atoms/RadioButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as EmptySearchIcon } from 'app/icons/search_empty.svg';
import { searchAndFilterNetworks } from 'app/templates/AssetsFilterOptions/utils/search-and-filter-networks';
import { SearchBarField } from 'app/templates/SearchField';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { navigate } from 'lib/woozie';
import {
  EvmChain,
  TezosChain,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { TempleChainKind } from 'temple/types';

export type SelectedChain = EvmChain | TezosChain;

interface SelectNetworkPageProps {
  selectedChain: EvmChain | TezosChain;
  onNetworkSelect: (chain: SelectedChain) => void;
  onCloseClick: EmptyFn;
}

export const SelectNetworkPage: FC<SelectNetworkPageProps> = ({ selectedChain, onNetworkSelect, onCloseClick }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const sortedNetworks = useMemo(
    () => [...(accountTezAddress ? tezosChains : []), ...(accountEvmAddress ? evmChains : [])],
    [accountEvmAddress, accountTezAddress, evmChains, tezosChains]
  );

  const [searchValue, setSearchValue] = useState('');

  const filteredNetworks = useMemo(
    () => (searchValue.length ? searchAndFilterNetworks<SelectedChain>(sortedNetworks, searchValue) : sortedNetworks),
    [searchValue, sortedNetworks]
  );

  return (
    <>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <StayActiveIconButton Icon={PlusIcon} color="blue" onClick={() => void navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto">
        {filteredNetworks.length === 0 && (
          <div className="w-full h-full flex flex-col items-center">
            <div className="flex-1 py-7 flex flex-col items-center justify-center text-grey-2">
              <EmptySearchIcon />

              <p className="mt-2 text-center text-font-medium-bold">
                <T id="notFound" />
              </p>
            </div>
          </div>
        )}

        {filteredNetworks.map(network => {
          if (network.kind === TempleChainKind.Tezos) {
            return (
              <Network
                key={network.chainId}
                active={selectedChain?.kind === TempleChainKind.Tezos && selectedChain.chainId === network.chainId}
                icon={
                  network.chainId === TEZOS_MAINNET_CHAIN_ID ? (
                    <TezosNetworkLogo size={24} />
                  ) : (
                    <NetworkLogoFallback networkName={network.name} size={24} />
                  )
                }
                name={network.name}
                attractSelf
                onClick={() => onNetworkSelect(network)}
              />
            );
          }

          return (
            <Network
              key={network.chainId}
              active={selectedChain?.kind === TempleChainKind.EVM && selectedChain.chainId === network.chainId}
              icon={
                <EvmNetworkLogo networkName={network.name} chainId={network.chainId} size={24} imgClassName="p-0.5" />
              }
              name={network.name}
              attractSelf
              onClick={() => onNetworkSelect(network)}
            />
          );
        })}
      </div>

      <div className="p-4 pb-6 flex flex-col bg-white">
        <StyledButton size="L" color="primary-low" onClick={onCloseClick}>
          <T id="close" />
        </StyledButton>
      </div>
    </>
  );
};

interface NetworkProps {
  active: boolean;
  icon: JSX.Element;
  name: string;
  attractSelf: boolean;
  onClick: EmptyFn;
}

const Network: FC<NetworkProps> = ({ active, icon, name, attractSelf, onClick }) => {
  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  return (
    <div
      ref={elemRef}
      className="cursor-pointer mb-3 flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent group"
      onClick={onClick}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <span className="text-font-medium-bold">{name}</span>
      </div>
      <RadioButton active={active} className={active ? undefined : 'opacity-0 group-hover:opacity-100'} />
    </div>
  );
};
