import React, { memo, useCallback, useState, MouseEvent, Suspense, useEffect, useMemo, FC } from 'react';

import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { NetworkPopper } from 'app/templates/network-popper';
import { SearchBarField } from 'app/templates/SearchField';
import { LifiSupportedChains } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { t } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmChainAssetsList } from './EvmChainAssetsList';
import { MultiChainAssetsList } from './MultiChainAssetsList';
import { TezosChainAssetsList } from './TezosChainAssetsList';

interface SelectTokenModalProps {
  activeField: 'from' | 'to';
  onAssetSelect: (chainSlug: string) => void;
  opened: boolean;
  onRequestClose: EmptyFn;
  chainId?: number | string | null;
  chainKind: TempleChainKind.EVM | TempleChainKind.Tezos | null;
}

export const SwapSelectAssetModal = memo<SelectTokenModalProps>(
  ({ activeField, onAssetSelect, opened, onRequestClose, chainId, chainKind }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const evmNetwork = useEvmChainByChainId((chainId as number) || ETHEREUM_MAINNET_CHAIN_ID)!;
    const tezosNetwork = useTezosMainnetChain();

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

    useEffect(() => {
      if (activeField === 'to') {
        setLocalFilterChain(chainKind === TempleChainKind.EVM ? evmNetwork : tezosNetwork);
      } else {
        setLocalFilterChain(filterChain);
      }
    }, [activeField, chainKind, evmNetwork, filterChain, tezosNetwork]);

    const AssetsList = useMemo(() => {
      if (localFilterChain?.kind === TempleChainKind.Tezos && accountTezAddress)
        return (
          <TezosChainAssetsList
            chainId={localFilterChain.chainId}
            filterZeroBalances={activeField === 'from'}
            publicKeyHash={accountTezAddress}
            searchValue={searchValueDebounced}
            onAssetSelect={handleAssetSelect}
          />
        );

      if (localFilterChain?.kind === TempleChainKind.EVM && accountEvmAddress)
        return (
          <EvmChainAssetsList
            chainId={localFilterChain.chainId}
            filterZeroBalances={activeField === 'from'}
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

      return null;
    }, [localFilterChain, accountTezAddress, activeField, searchValueDebounced, handleAssetSelect, accountEvmAddress]);

    const handleFilterOptionSelect = useCallback((filterChain: FilterChain) => setLocalFilterChain(filterChain), []);

    return (
      <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col px-4 pt-4 pb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-font-description-bold">{t('filterByNetwork')}</span>
            <FilterNetworkPopper selectedOption={localFilterChain} onOptionSelect={handleFilterOptionSelect} />
          </div>

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
  }
);

interface FilterNetworkPopperProps {
  selectedOption: FilterChain;
  onOptionSelect: (filterChain: FilterChain) => void;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(({ selectedOption, onOptionSelect }) => (
  <NetworkPopper
    selectedOption={selectedOption}
    onOptionSelect={onOptionSelect}
    showAllNetworksOption
    supportedChainIds={LifiSupportedChains}
  >
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

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner className="w-20" />
  </div>
);
