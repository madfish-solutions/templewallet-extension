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
import { useSettings } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

import { SearchBarField } from '../SearchField';

import { ALL_NETWORKS, FAVORITES } from './constants';
import { NetworkOption } from './option';
import { NetworkPopperProps, Network } from './types';

interface NetworkDropdownProps extends Omit<NetworkPopperProps, 'children'>, PopperRenderProps {}

export const NetworkDropdown = memo<NetworkDropdownProps>(
  ({
    opened,
    setOpened,
    selectedOption,
    showAllNetworksOption,
    showFavoritesOption = false,
    chainKind,
    onOptionSelect,
    supportedChainIds
  }) => {
    const accountTezAddress = useAccountAddressForTezos();
    const accountEvmAddress = useAccountAddressForEvm();

    const { favoriteTokens = [] } = useSettings();
    const tezosChains = useEnabledTezosChains();
    const evmChainsUnfiltered = useEnabledEvmChains();

    const evmChains = useMemo(() => {
      if (!supportedChainIds) return evmChainsUnfiltered;

      return evmChainsUnfiltered.filter(chain => supportedChainIds.includes(Number(chain.chainId)));
    }, [evmChainsUnfiltered, supportedChainIds]);

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const [attractSelectedNetwork, setAttractSelectedNetwork] = useState(true);

    useEffect(() => {
      if (searchValueDebounced) setAttractSelectedNetwork(false);
      else if (!opened) setAttractSelectedNetwork(true);
    }, [opened, searchValueDebounced]);

    const networks = useMemo(() => {
      const showFavorites = showFavoritesOption && favoriteTokens && favoriteTokens.length > 0;
      const generalOptions: Network[] = showAllNetworksOption ? [ALL_NETWORKS] : [];
      if (showFavorites) {
        generalOptions.unshift('favorites');
      }

      return generalOptions
        .concat(accountTezAddress && (!chainKind || chainKind === TempleChainKind.Tezos) ? tezosChains : [])
        .concat(accountEvmAddress && (!chainKind || chainKind === TempleChainKind.EVM) ? evmChains : []);
    }, [
      accountEvmAddress,
      accountTezAddress,
      chainKind,
      evmChains,
      favoriteTokens,
      showAllNetworksOption,
      showFavoritesOption,
      tezosChains
    ]);

    const filteredNetworks = useMemo(
      () => (searchValueDebounced.length ? searchAndFilterChains(networks, searchValueDebounced) : networks),
      [searchValueDebounced, networks]
    );

    return (
      <ActionsDropdownPopup title={<T id="selectNetwork" />} opened={opened} style={{ width: 196, height: 340 }}>
        <div className="mb-1">
          <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} />
        </div>

        <div className="flex flex-col flex-grow overflow-y-auto">
          {filteredNetworks.length === 0 && <EmptyState text="" iconSize={60} forSearch />}

          {filteredNetworks.map(network => (
            <NetworkOption
              key={typeof network === 'string' ? network : network.chainId}
              network={network}
              activeNetwork={selectedOption}
              attractSelf={attractSelectedNetwork}
              onClick={() => {
                if (typeof network === 'string') {
                  onOptionSelect(network === FAVORITES ? FAVORITES : null);
                } else {
                  onOptionSelect(network);
                }
                setOpened(false);
              }}
            />
          ))}
        </div>
      </ActionsDropdownPopup>
    );
  }
);
