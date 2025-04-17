import React, { FC, useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { EmptyState } from 'app/atoms/EmptyState';
import { IconButton } from 'app/atoms/IconButton';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { Network } from 'app/templates/NetworkSelectModal';
import { SearchBarField } from 'app/templates/SearchField';
import { searchAndFilterChains } from 'lib/ui/search-networks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { navigate } from 'lib/woozie';
import {
  OneOfChains,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';

interface SelectNetworkPageProps {
  selectedNetwork: OneOfChains;
  onNetworkSelect: (network: OneOfChains) => void;
}

export const SelectNetworkPage: FC<SelectNetworkPageProps> = ({ selectedNetwork, onNetworkSelect }) => {
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
      isSearchStringApplicable(searchValueDebounced)
        ? searchAndFilterChains(sortedNetworks, searchValueDebounced)
        : sortedNetworks,
    [searchValueDebounced, sortedNetworks]
  );

  const handleNetworkSelect = useCallback(
    (network: OneOfChains | string) => {
      if (typeof network === 'string') return;

      onNetworkSelect(network);
    },
    [onNetworkSelect]
  );

  return (
    <>
      <div className="flex gap-x-2 p-4 pb-3">
        <SearchBarField value={searchValue} placeholder="Network name" onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => navigate('settings/networks')} />
      </div>

      <ScrollView className="pt-1">
        {filteredNetworks.length === 0 && <EmptyState />}

        {filteredNetworks.map(network => (
          <Network
            key={network.chainId}
            network={network}
            activeNetwork={selectedNetwork}
            attractSelf
            iconSize={24}
            onClick={handleNetworkSelect}
          />
        ))}
      </ScrollView>
    </>
  );
};
