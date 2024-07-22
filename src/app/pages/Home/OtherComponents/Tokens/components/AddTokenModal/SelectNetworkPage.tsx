import React, { FC, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { StayActiveIconButton } from 'app/atoms/IconButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { EmptyNetworksSearch } from 'app/templates/EmptyNetworksSearch';
import { Network } from 'app/templates/NetworkSelectModal';
import { SearchBarField } from 'app/templates/SearchField';
import { T } from 'lib/i18n';
import { navigate } from 'lib/woozie';
import {
  EvmChain,
  TezosChain,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';

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
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredNetworks = useMemo(
    () =>
      searchValueDebounced.length
        ? searchAndFilterNetworksByName<SelectedChain>(sortedNetworks, searchValueDebounced)
        : sortedNetworks,
    [searchValueDebounced, sortedNetworks]
  );

  return (
    <>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <StayActiveIconButton Icon={PlusIcon} color="blue" onClick={() => void navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto">
        {filteredNetworks.length === 0 && <EmptyNetworksSearch />}

        {filteredNetworks.map(network => (
          <Network
            key={network.chainId}
            network={network}
            activeNetwork={selectedChain}
            attractSelf
            onClick={() => onNetworkSelect(network)}
          />
        ))}
      </div>

      <div className="p-4 pb-6 flex flex-col bg-white">
        <StyledButton size="L" color="primary-low" onClick={onCloseClick}>
          <T id="close" />
        </StyledButton>
      </div>
    </>
  );
};

const searchAndFilterNetworksByName = <T extends EvmChain | TezosChain>(networks: T[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return networks.filter(network => network.name.toLowerCase().includes(preparedSearchValue));
};
