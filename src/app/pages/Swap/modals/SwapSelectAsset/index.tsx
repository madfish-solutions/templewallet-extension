import React, { memo, useCallback, useState, MouseEvent, Suspense, useEffect, useMemo, FC } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import {
  useLifiEvmTokensMetadataRecordSelector,
  useLifiSupportedChainIdsSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { NetworkPopper } from 'app/templates/network-popper';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { AllEvmChainsAssetsList } from './AllEvmChainsAssetsList';
import { EvmChainAssetsList } from './EvmChainAssetsList';
import { MultiChainAssetsList } from './MultiChainAssetsList';
import { TezosChainAssetsList } from './TezosChainAssetsList';

interface SelectTokenModalProps {
  activeField: SwapFieldName;
  onAssetSelect: (chainSlug: string) => void;
  opened: boolean;
  onRequestClose: EmptyFn;
  chainKind: TempleChainKind.EVM | TempleChainKind.Tezos | null;
}

export const SwapSelectAssetModal = memo<SelectTokenModalProps>(
  ({ activeField, onAssetSelect, opened, onRequestClose, chainKind }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);
    const metadataRecord = useLifiEvmTokensMetadataRecordSelector();

    const tezosNetwork = useTezosMainnetChain();

    const { filterChain } = useAssetsFilterOptionsSelector();

    const [localFilterChain, setLocalFilterChain] = useState(filterChain);

    const accountTezAddress = useAccountAddressForTezos();
    const accountEvmAddress = useAccountAddressForEvm();

    useEffect(() => {
      if (!opened) {
        setSearchValue('');
        setLocalFilterChain(null);
      }
    }, [opened]);

    const handleAssetSelect = useCallback(
      (e: MouseEvent, chainSlug: string) => {
        e.preventDefault();
        onAssetSelect(chainSlug);
      },
      [onAssetSelect]
    );

    useEffect(() => {
      if (activeField === 'output' && opened) {
        setLocalFilterChain(chainKind === TempleChainKind.EVM ? null : tezosNetwork);
      }
    }, [activeField, chainKind, opened, tezosNetwork]);

    const assetsList = useMemo(() => {
      if (localFilterChain?.kind === TempleChainKind.Tezos && accountTezAddress)
        return (
          <TezosChainAssetsList
            chainId={localFilterChain.chainId}
            filterZeroBalances={activeField === 'input'}
            publicKeyHash={accountTezAddress}
            searchValue={searchValueDebounced}
            onAssetSelect={handleAssetSelect}
          />
        );

      if (localFilterChain?.kind === TempleChainKind.EVM && accountEvmAddress)
        return (
          <EvmChainAssetsList
            chainId={localFilterChain.chainId}
            filterZeroBalances={activeField === 'input'}
            publicKeyHash={accountEvmAddress}
            searchValue={searchValueDebounced}
            onAssetSelect={handleAssetSelect}
          />
        );

      if (!localFilterChain) {
        if (accountTezAddress && accountEvmAddress)
          return (
            <MultiChainAssetsList
              filterZeroBalances={activeField === 'input'}
              accountTezAddress={accountTezAddress}
              accountEvmAddress={accountEvmAddress}
              searchValue={searchValueDebounced}
              onAssetSelect={handleAssetSelect}
            />
          );

        if (accountTezAddress)
          return (
            <TezosChainAssetsList
              chainId={tezosNetwork.chainId}
              filterZeroBalances={activeField === 'input'}
              publicKeyHash={accountTezAddress}
              searchValue={searchValueDebounced}
              onAssetSelect={handleAssetSelect}
            />
          );

        if (accountEvmAddress)
          return (
            <AllEvmChainsAssetsList
              accountEvmAddress={accountEvmAddress}
              searchValue={searchValueDebounced}
              onAssetSelect={handleAssetSelect}
            />
          );
      }

      return null;
    }, [
      localFilterChain,
      accountTezAddress,
      activeField,
      searchValueDebounced,
      handleAssetSelect,
      accountEvmAddress,
      tezosNetwork.chainId
    ]);

    const handleFilterOptionSelect = useCallback((filterChain: FilterChain) => setLocalFilterChain(filterChain), []);

    const disabledNetworkPopper = useMemo(
      () => localFilterChain?.kind === 'tezos' && activeField === 'output',
      [localFilterChain, activeField]
    );

    const availableChainIds = useMemo(
      () =>
        Object.entries(metadataRecord)
          .filter(([_, record]) => Object.keys(record).length > 0)
          .map(([chainId]) => Number(chainId)),
      [metadataRecord]
    );

    return (
      <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col px-4 pt-4 pb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-font-description-bold">{t('filterByNetwork')}</span>
            <FilterNetworkPopper
              selectedOption={localFilterChain}
              onOptionSelect={handleFilterOptionSelect}
              disabledNetworkPopper={disabledNetworkPopper}
              showOnlyEvmNetworks={localFilterChain?.kind !== 'tezos' && activeField === 'output'}
              availableChainIds={activeField === 'output' ? availableChainIds : undefined}
            />
          </div>

          <SearchBarField
            value={searchValue}
            placeholder="Token name"
            defaultRightMargin={false}
            onValueChange={setSearchValue}
          />
        </div>

        <Suspense fallback={<SpinnerSection />}>{assetsList}</Suspense>
      </PageModal>
    );
  }
);

interface FilterNetworkPopperProps {
  selectedOption: FilterChain;
  onOptionSelect: (filterChain: FilterChain) => void;
  availableChainIds?: number[];
  disabledNetworkPopper: boolean;
  showOnlyEvmNetworks: boolean;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(
  ({ selectedOption, onOptionSelect, disabledNetworkPopper, showOnlyEvmNetworks, availableChainIds }) => {
    const supportedChainIds = useLifiSupportedChainIdsSelector();

    return (
      <NetworkPopper
        selectedOption={selectedOption}
        onOptionSelect={onOptionSelect}
        showAllNetworksOption
        showOnlyEvmNetworks={showOnlyEvmNetworks}
        supportedChainIds={supportedChainIds}
        availableChainIds={availableChainIds}
      >
        {({ ref, toggleOpened, selectedOptionName }) => (
          <Button
            disabled={disabledNetworkPopper}
            ref={ref}
            className={clsx(
              'flex items-center py-0.5 px-1 text-font-description-bold rounded',
              disabledNetworkPopper ? 'text-disable' : 'text-secondary hover:bg-secondary-low'
            )}
            onClick={toggleOpened}
          >
            <span>{selectedOptionName}</span>
            <IconBase Icon={CompactDown} size={12} />
          </Button>
        )}
      </NetworkPopper>
    );
  }
);

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <PageLoader className="w-20" />
  </div>
);
