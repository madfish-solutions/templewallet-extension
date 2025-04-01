import React, { memo, useCallback, useState, MouseEvent, Suspense, useEffect } from 'react';

import { noop } from 'lodash';
import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { SpinnerSection } from 'app/pages/Send/form/SpinnerSection';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { NetworkPopper } from 'app/templates/network-popper';
import { SearchBarField } from 'app/templates/SearchField';
import { useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';

import { TezosChainAssetsList } from './TezosChainAssetsList';

interface SelectTokenModalProps {
  route3tokensSlugs: string[];
  inputName: 'input' | 'output';
  onAssetSelect: (chainSlug: string) => void;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const SwapSelectAssetModal = memo<SelectTokenModalProps>(
  ({ route3tokensSlugs, inputName, onAssetSelect, opened, onRequestClose }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const accountTezAddress = useAccountAddressForTezos();

    const network = useTezosMainnetChain();

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

    // TODO: pass a function to the FilterNetworkPopper when support for other chains will be added
    return (
      <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col px-4 pt-4 pb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-font-description-bold">Filter by network</span>
            <FilterNetworkPopper selectedOption={network} onOptionSelect={noop} />
          </div>

          <SearchBarField
            value={searchValue}
            placeholder="Token name"
            defaultRightMargin={false}
            onValueChange={setSearchValue}
          />
        </div>

        <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto">
          <Suspense fallback={<SpinnerSection />}>
            {accountTezAddress && (
              <TezosChainAssetsList
                chainId={network.chainId}
                route3tokensSlugs={route3tokensSlugs}
                filterZeroBalances={inputName === 'input'}
                publicKeyHash={accountTezAddress}
                searchValue={searchValueDebounced}
                onAssetSelect={handleAssetSelect}
              />
            )}
          </Suspense>
        </div>
      </PageModal>
    );
  }
);

interface FilterNetworkPopperProps {
  selectedOption: FilterChain;
  onOptionSelect: (filterChain: FilterChain) => void;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(({ selectedOption, onOptionSelect }) => (
  <NetworkPopper selectedOption={selectedOption} onOptionSelect={onOptionSelect} showAllNetworksOption>
    {({ ref, toggleOpened, selectedOptionName }) => (
      <Button
        disabled={true}
        ref={ref}
        className="flex items-center py-0.5 px-1 text-font-description-bold rounded text-disable"
        onClick={toggleOpened}
      >
        <span>{selectedOptionName}</span>
        <IconBase Icon={CompactDown} size={12} className="text-disable" />
      </Button>
    )}
  </NetworkPopper>
));
