import React, { memo, useCallback, useState, MouseEvent, useMemo, Suspense, useEffect } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { EmptyState } from 'app/atoms/EmptyState';
import { Size } from 'app/atoms/IconBase';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { SpinnerSection } from 'app/pages/Send/form/SpinnerSection';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { SearchBarField } from 'app/templates/SearchField';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import {
  OneOfChains,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmAssetsList } from './EvmAssetsList';
import { EvmChainAssetsList } from './EvmChainAssetsList';
import { MultiChainAssetsList } from './MultiChainAssetsList';
import { TezosAssetsList } from './TezosAssetsList';
import { TezosChainAssetsList } from './TezosChainAssetsList';

interface SelectTokenModalProps {
  onAssetSelect: (chainSlug: string) => void;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const SelectAssetModal = memo<SelectTokenModalProps>(({ onAssetSelect, opened, onRequestClose }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const { filterChain } = useAssetsFilterOptionsSelector();

  const [localFilterChain, setLocalFilterChain] = useState(filterChain);

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  useEffect(() => {
    if (!opened) setSearchValue('');
  }, [opened]);

  const handleAssetSelect = useCallback(
    (e: MouseEvent, chainSlug: string) => {
      e.preventDefault();
      onAssetSelect(chainSlug);
    },
    [onAssetSelect]
  );

  const AssetsList = useMemo(() => {
    if (localFilterChain?.kind === TempleChainKind.Tezos && accountTezAddress)
      return (
        <TezosChainAssetsList
          chainId={localFilterChain.chainId}
          publicKeyHash={accountTezAddress}
          searchValue={searchValueDebounced}
          onAssetSelect={handleAssetSelect}
        />
      );

    if (localFilterChain?.kind === TempleChainKind.EVM && accountEvmAddress)
      return (
        <EvmChainAssetsList
          chainId={localFilterChain.chainId}
          publicKeyHash={accountEvmAddress}
          searchValue={searchValueDebounced}
          onAssetSelect={handleAssetSelect}
        />
      );

    if (!localFilterChain && accountTezAddress && accountEvmAddress)
      return (
        <MultiChainAssetsList
          accountTezAddress={accountTezAddress}
          accountEvmAddress={accountEvmAddress}
          searchValue={searchValueDebounced}
          onAssetSelect={handleAssetSelect}
        />
      );

    if (!localFilterChain && accountTezAddress)
      return (
        <TezosAssetsList
          publicKeyHash={accountTezAddress}
          searchValue={searchValueDebounced}
          onAssetSelect={handleAssetSelect}
        />
      );

    if (!localFilterChain && accountEvmAddress)
      return (
        <EvmAssetsList
          publicKeyHash={accountEvmAddress}
          searchValue={searchValueDebounced}
          onAssetSelect={handleAssetSelect}
        />
      );

    return null;
  }, [accountEvmAddress, accountTezAddress, localFilterChain, handleAssetSelect, searchValueDebounced]);

  const handleFilterOptionSelect = useCallback((filterChain: FilterChain) => setLocalFilterChain(filterChain), []);

  return (
    <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
      <div className="flex flex-col px-4 pt-4 pb-3">
        {!filterChain && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-font-description-bold">Filter by network</span>
            <FilterNetworkPopper selectedOption={localFilterChain} onOptionSelect={handleFilterOptionSelect} />
          </div>
        )}

        <SearchBarField
          value={searchValue}
          placeholder="Token name"
          defaultRightMargin={false}
          onValueChange={setSearchValue}
        />
      </div>

      <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto">
        <Suspense fallback={<SpinnerSection />}>{AssetsList}</Suspense>
      </div>
    </PageModal>
  );
});

const ALL_NETWORKS = 'All Networks';

interface FilterNetworkPopperProps {
  selectedOption: FilterChain;
  onOptionSelect: (filterChain: FilterChain) => void;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(({ selectedOption, onOptionSelect }) => {
  const allTezosChains = useAllTezosChains();
  const allEvmChains = useAllEvmChains();

  const selectedOptionName = useMemo(() => {
    if (!selectedOption) return ALL_NETWORKS;

    if (selectedOption.kind === TempleChainKind.Tezos) {
      return allTezosChains[selectedOption.chainId]?.name;
    }

    return allEvmChains[selectedOption.chainId]?.name;
  }, [allEvmChains, allTezosChains, selectedOption]);

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={popperProps => (
        <FilterNetworkDropdown selectedOption={selectedOption} onOptionSelect={onOptionSelect} {...popperProps} />
      )}
    >
      {({ ref, toggleOpened }) => (
        <Button
          ref={ref}
          className="flex items-center py-0.5 px-1 text-font-description-bold rounded text-secondary hover:bg-secondary-low"
          onClick={toggleOpened}
        >
          <span>{selectedOptionName}</span>
          <IconBase Icon={CompactDown} size={12} />
        </Button>
      )}
    </Popper>
  );
});

interface FilterNetworkDropdownProps extends FilterNetworkPopperProps, PopperRenderProps {}

const FilterNetworkDropdown = memo<FilterNetworkDropdownProps>(
  ({ opened, setOpened, selectedOption, onOptionSelect }) => {
    const accountTezAddress = useAccountAddressForTezos();
    const accountEvmAddress = useAccountAddressForEvm();

    const tezosChains = useEnabledTezosChains();
    const evmChains = useEnabledEvmChains();

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const [attractSelectedNetwork, setAttractSelectedNetwork] = useState(true);

    useEffect(() => {
      if (searchValueDebounced) setAttractSelectedNetwork(false);
      else if (!opened) setAttractSelectedNetwork(true);
    }, [opened, searchValueDebounced]);

    const networks = useMemo(
      () => [ALL_NETWORKS, ...(accountTezAddress ? tezosChains : []), ...(accountEvmAddress ? evmChains : [])],
      [accountEvmAddress, accountTezAddress, evmChains, tezosChains]
    );

    const filteredNetworks = useMemo(
      () =>
        searchValueDebounced.length
          ? searchAndFilterNetworksByName<string | OneOfChains>(networks, searchValueDebounced)
          : networks,
      [searchValueDebounced, networks]
    );

    return (
      <ActionsDropdownPopup title="Select Network" opened={opened} style={{ width: 196, height: 340 }}>
        <div className="mb-1">
          <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} />
        </div>

        <div className="flex flex-col flex-grow overflow-y-auto">
          {filteredNetworks.length === 0 && <EmptyState text="" iconSize={60} forSearch />}

          {filteredNetworks.map(network => (
            <FilterOption
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

type Network = OneOfChains | string;

interface FilterOptionProps {
  network: Network;
  activeNetwork: FilterChain;
  attractSelf: boolean;
  iconSize?: Size;
  onClick?: EmptyFn;
}

const FilterOption = memo<FilterOptionProps>(({ network, activeNetwork, attractSelf, iconSize = 24, onClick }) => {
  const isAllNetworks = typeof network === 'string';

  const active = isAllNetworks ? activeNetwork === null : network.chainId === activeNetwork?.chainId;

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  const Icon = useMemo(() => {
    if (isAllNetworks) return <IconBase Icon={Browse} className="text-primary" size={16} />;

    if (network.kind === TempleChainKind.Tezos) return <TezosNetworkLogo chainId={network.chainId} size={iconSize} />;

    if (network.kind === TempleChainKind.EVM)
      return <EvmNetworkLogo chainId={network.chainId} size={iconSize} imgClassName="p-0.5" />;

    return null;
  }, [isAllNetworks, network, iconSize]);

  const handleClick = useCallback(() => {
    if (active) return;

    onClick?.();
  }, [active, onClick]);

  return (
    <div
      ref={elemRef}
      className={clsx(
        'flex justify-between items-center rounded-md p-2 text-font-description',
        active ? 'bg-grey-4' : 'cursor-pointer hover:bg-secondary-low'
      )}
      onClick={handleClick}
    >
      <span>{isAllNetworks ? ALL_NETWORKS : network.name}</span>
      {Icon}
    </div>
  );
});

type SearchNetwork = string | { name: string };

/** @deprecated // Apply searchAndFilterChains() instead */
const searchAndFilterNetworksByName = <T extends SearchNetwork>(networks: T[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return networks.filter(network => {
    if (typeof network === 'string') return network.toLowerCase().includes(preparedSearchValue);

    return network.name.toLowerCase().includes(preparedSearchValue);
  });
};
