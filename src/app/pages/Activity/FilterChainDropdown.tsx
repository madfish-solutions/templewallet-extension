import React, { memo, useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { IconBase } from 'app/atoms';
import { ActionListItem } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as BrowseSvg } from 'app/icons/base/browse.svg';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { SearchBarField } from 'app/templates/SearchField';
import { T, t } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';
import { isSearchStringApplicable, searchAndFilterItems } from 'lib/utils/search-items';
import { OneOfChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface Props extends PopperRenderProps {
  filterChain: FilterChain;
  setFilterChain: (chain: OneOfChains | null) => void;
}

export const FilterChainDropdown = memo<Props>(({ filterChain, setFilterChain, opened, setOpened }) => {
  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const networks = useMemo<OneOfChains[]>(() => [...tezosChains, ...evmChains], [tezosChains, evmChains]);

  const searchedNetworks = useMemo(
    () => (inSearch ? searchAndFilterChains(networks, searchValueDebounced) : networks),
    [inSearch, searchValueDebounced, networks]
  );

  const onChainClick = useCallback(
    (chain: OneOfChains | null) => {
      setFilterChain(chain);
      setOpened(false);
    },
    [setFilterChain, setOpened]
  );

  return (
    <ActionsDropdownPopup title="Select Network" opened={opened} lowering={1} style={{ minWidth: 196 }}>
      <SearchBarField value={searchValue} onValueChange={setSearchValue} containerClassName="!mr-0 mb-2" />

      {!inSearch && (
        <ActionListItem active={filterChain === null} className="justify-between" onClick={() => onChainClick(null)}>
          <span>
            <T id="allNetworks" />
          </span>

          <IconBase Icon={BrowseSvg} className="text-primary" />
        </ActionListItem>
      )}

      {searchedNetworks.map(chain => (
        <ActionListItem
          key={chain.chainId}
          active={chain.chainId === filterChain?.chainId}
          className="justify-between"
          onClick={() => onChainClick(chain)}
        >
          <span>{chain.nameI18nKey ? <T id={chain.nameI18nKey} /> : chain.name}</span>

          {chain.kind === TempleChainKind.Tezos ? (
            <TezosNetworkLogo chainId={chain.chainId} />
          ) : (
            <EvmNetworkLogo chainId={chain.chainId} />
          )}
        </ActionListItem>
      ))}
    </ActionsDropdownPopup>
  );
});

function searchAndFilterChains(networks: OneOfChains[], searchValue: string) {
  return searchAndFilterItems(
    networks,
    searchValue.trim(),
    [
      { name: 'name', weight: 1 },
      { name: 'nameI18n', weight: 1 }
    ],
    ({ name, nameI18nKey }) => ({
      name,
      nameI18n: nameI18nKey ? t(nameI18nKey) : undefined
    })
  );
}
