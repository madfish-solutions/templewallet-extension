import React, { memo, useEffect, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { EmptyState } from 'app/atoms/EmptyState';
import { T } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';
import { searchAndFilterChains } from 'lib/ui/search-networks';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SearchBarField } from '../SearchField';

import { ALL_NETWORKS } from './constants';
import { NetworkOption } from './option';
import { NetworkPopperProps, Network } from './types';

interface NetworkDropdownProps extends Omit<NetworkPopperProps, 'children'>, PopperRenderProps {}

export const NetworkDropdown = memo<NetworkDropdownProps>(
  ({
    opened,
    setOpened,
    selectedOption,
    showAllNetworksOption,
    showOnlyEvmNetworks,
    chainKind,
    onOptionSelect,
    supportedChainIds,
    availableChainIds
  }) => {
    const accountTezAddress = useAccountAddressForTezos();
    const accountEvmAddress = useAccountAddressForEvm();

    const tezosChains = useEnabledTezosChains();
    const evmChainsUnfiltered = useEnabledEvmChains();

    const evmChains = useMemo(() => {
      const filterBy = availableChainIds ?? supportedChainIds;
      if (!filterBy) return evmChainsUnfiltered;

      return evmChainsUnfiltered.filter(chain => filterBy.includes(Number(chain.chainId)));
    }, [evmChainsUnfiltered, availableChainIds, supportedChainIds]);

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const [attractSelectedNetwork, setAttractSelectedNetwork] = useState(true);

    useEffect(() => {
      if (searchValueDebounced) setAttractSelectedNetwork(false);
      else if (!opened) setAttractSelectedNetwork(true);
    }, [opened, searchValueDebounced]);

    const networks = useMemo(() => {
      const generalOptions: Network[] = showAllNetworksOption ? [ALL_NETWORKS] : [];

      const includeTezos =
        accountTezAddress && !showOnlyEvmNetworks && (!chainKind || chainKind === TempleChainKind.Tezos);
      const includeEvm = accountEvmAddress && (!chainKind || chainKind === TempleChainKind.EVM);

      return generalOptions.concat(includeTezos ? tezosChains : []).concat(includeEvm ? evmChains : []);
    }, [
      accountEvmAddress,
      accountTezAddress,
      chainKind,
      evmChains,
      showAllNetworksOption,
      tezosChains,
      showOnlyEvmNetworks
    ]);

    const filteredNetworks = useMemo(
      () => (searchValueDebounced.length ? searchAndFilterChains(networks, searchValueDebounced) : networks),
      [searchValueDebounced, networks]
    );

    return (
      <ActionsDropdownPopup title={<T id="selectNetwork" />} opened={opened} style={{ width: 196, maxHeight: 340 }}>
        <div className="mb-1">
          <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} />
        </div>

        <div className="flex flex-col flex-grow overflow-y-auto">
          {filteredNetworks.length === 0 && <EmptyState text="" iconSize={60} forSearch />}

          {filteredNetworks.map(network => (
            <NetworkOption
              key={typeof network === 'string' ? ALL_NETWORKS : network.chainId}
              network={network}
              activeNetwork={selectedOption}
              attractSelf={attractSelectedNetwork}
              onClick={() => {
                onOptionSelect(typeof network === 'string' ? null : network);
                setOpened(false);
              }}
            />
          ))}
        </div>
      </ActionsDropdownPopup>
    );
  }
);
