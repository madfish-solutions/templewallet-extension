import React, { memo, useCallback, useState, MouseEvent, useMemo, Suspense, useEffect } from 'react';

import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { isFilterChain } from 'app/pages/Swap/form/utils';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { NetworkPopper } from 'app/templates/network-popper';
import { SearchBarField } from 'app/templates/SearchField';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SELECT_ASSET_SCROLLABLE_ID } from './constants';
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

  const [localFilterChain, setLocalFilterChain] = useState<FilterChain | string>(filterChain);

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
    if (isFilterChain(localFilterChain) && localFilterChain?.kind === TempleChainKind.Tezos && accountTezAddress)
      return (
        <TezosChainAssetsList
          chainId={localFilterChain.chainId}
          publicKeyHash={accountTezAddress}
          searchValue={searchValueDebounced}
          onAssetSelect={handleAssetSelect}
        />
      );

    if (isFilterChain(localFilterChain) && localFilterChain?.kind === TempleChainKind.EVM && accountEvmAddress)
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

  const handleFilterOptionSelect = useCallback(
    (filterChain: FilterChain | string) => setLocalFilterChain(filterChain),
    []
  );

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

      <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto" id={SELECT_ASSET_SCROLLABLE_ID}>
        <Suspense fallback={<PageLoader stretch />}>{AssetsList}</Suspense>
      </div>
    </PageModal>
  );
});

interface FilterNetworkPopperProps {
  selectedOption: FilterChain | string;
  onOptionSelect: (filterChain: FilterChain | string) => void;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(({ selectedOption, onOptionSelect }) => (
  <NetworkPopper selectedOption={selectedOption} onOptionSelect={onOptionSelect} showAllNetworksOption>
    {({ ref, toggleOpened, selectedOptionName }) => (
      <Button
        ref={ref}
        className="flex items-center py-0.5 px-1 text-font-description-bold rounded text-secondary hover:bg-secondary-low"
        onClick={toggleOpened}
      >
        <span>{selectedOptionName}</span>
        <IconBase Icon={CompactDown} size={12} />
      </Button>
    )}
  </NetworkPopper>
));
