import React, { memo, useCallback, useState, MouseEvent, Suspense, useEffect, useMemo, FC } from 'react';

import clsx from 'clsx';
import { uniq } from 'lodash';
import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import {
  use3RouteEvmSupportedChainIdsSelector,
  use3RouteEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-3route-metadata/selectors';
import {
  useLifiConnectedEvmTokensMetadataRecordSelector,
  useLifiSupportedChainIdsSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { NetworkPopper } from 'app/templates/network-popper';
import { FAVORITES } from 'app/templates/network-popper/constants';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SwapFieldName } from '../../form/interfaces';
import { isFilterChain } from '../../form/utils';

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
    const lifiMetadataRecord = useLifiConnectedEvmTokensMetadataRecordSelector();
    const route3MetadataRecord = use3RouteEvmTokensMetadataRecordSelector();

    const tezosNetwork = useTezosMainnetChain();

    const { filterChain } = useAssetsFilterOptionsSelector();

    const [localFilterChain, setLocalFilterChain] = useState<FilterChain | string>(filterChain);

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

    const tezosNetworkMemoized = useMemoWithCompare(() => tezosNetwork, [tezosNetwork]);

    useEffect(() => {
      if (activeField === 'output' && opened) {
        setLocalFilterChain(chainKind === TempleChainKind.EVM ? null : tezosNetworkMemoized);
      }
    }, [activeField, chainKind, opened, tezosNetworkMemoized]);

    const assetsList = useMemo(() => {
      if (isFilterChain(localFilterChain) && localFilterChain?.kind === TempleChainKind.Tezos && accountTezAddress)
        return (
          <TezosChainAssetsList
            chainId={localFilterChain.chainId}
            activeField={activeField}
            publicKeyHash={accountTezAddress}
            searchValue={searchValueDebounced}
            onAssetSelect={handleAssetSelect}
          />
        );

      if (isFilterChain(localFilterChain) && localFilterChain?.kind === TempleChainKind.EVM && accountEvmAddress)
        return (
          <EvmChainAssetsList
            chainId={localFilterChain.chainId}
            activeField={activeField}
            publicKeyHash={accountEvmAddress}
            searchValue={searchValueDebounced}
            onAssetSelect={handleAssetSelect}
          />
        );

      if ((!localFilterChain || localFilterChain === FAVORITES) && (accountTezAddress || accountEvmAddress)) {
        if (accountTezAddress && accountEvmAddress)
          return (
            <MultiChainAssetsList
              activeField={activeField}
              accountTezAddress={accountTezAddress}
              accountEvmAddress={accountEvmAddress}
              showOnlyFavorites={localFilterChain === FAVORITES}
              searchValue={searchValueDebounced}
              onAssetSelect={handleAssetSelect}
            />
          );

        if (accountTezAddress)
          return (
            <TezosChainAssetsList
              chainId={tezosNetwork.chainId}
              activeField={activeField}
              publicKeyHash={accountTezAddress}
              searchValue={searchValueDebounced}
              onAssetSelect={handleAssetSelect}
            />
          );

        if (accountEvmAddress)
          return (
            <AllEvmChainsAssetsList
              activeField={activeField}
              showOnlyFavorites={localFilterChain === FAVORITES}
              accountEvmAddress={accountEvmAddress}
              searchValue={searchValueDebounced}
              onAssetSelect={handleAssetSelect}
            />
          );
      }

      return null;
    }, [
      accountEvmAddress,
      accountTezAddress,
      activeField,
      handleAssetSelect,
      localFilterChain,
      searchValueDebounced,
      tezosNetwork.chainId
    ]);

    const handleFilterOptionSelect = useCallback(
      (filterChain: FilterChain | string) => setLocalFilterChain(filterChain),
      []
    );

    const disabledNetworkPopper = useMemo(
      () => (isFilterChain(localFilterChain) && localFilterChain?.kind) === 'tezos' && activeField === 'output',
      [localFilterChain, activeField]
    );

    const availableChainIds = useMemo(() => {
      let metadataEntries: [string, StringRecord<unknown>][] = Object.entries(lifiMetadataRecord);
      metadataEntries = metadataEntries.concat(Object.entries(route3MetadataRecord));

      return metadataEntries
        .filter(([_, record]) => Object.keys(record).length > 0)
        .map(([chainId]) => Number(chainId));
    }, [lifiMetadataRecord, route3MetadataRecord]);

    return (
      <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col px-4 pt-4 pb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-font-description-bold">{t('filterByNetwork')}</span>
            <FilterNetworkPopper
              selectedOption={localFilterChain}
              onOptionSelect={handleFilterOptionSelect}
              disabledNetworkPopper={disabledNetworkPopper}
              showFavoritesOption={activeField === 'output'}
              showOnlyEvmNetworks={
                (isFilterChain(localFilterChain) && localFilterChain?.kind) !== 'tezos' && activeField === 'output'
              }
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
  selectedOption: FilterChain | string;
  onOptionSelect: (filterChain: FilterChain | string) => void;
  showFavoritesOption: boolean;
  availableChainIds?: number[];
  disabledNetworkPopper: boolean;
  showOnlyEvmNetworks: boolean;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(
  ({
    selectedOption,
    onOptionSelect,
    disabledNetworkPopper,
    showOnlyEvmNetworks,
    showFavoritesOption,
    availableChainIds
  }) => {
    const lifiSupportedChainIds = useLifiSupportedChainIdsSelector();
    const route3SupportedChainIds = use3RouteEvmSupportedChainIdsSelector();
    const supportedChainIds = useMemo(
      () => uniq(lifiSupportedChainIds.concat(route3SupportedChainIds)),
      [lifiSupportedChainIds, route3SupportedChainIds]
    );

    return (
      <NetworkPopper
        selectedOption={selectedOption}
        onOptionSelect={onOptionSelect}
        showAllNetworksOption
        showOnlyEvmNetworks={showOnlyEvmNetworks}
        showFavoritesOption={showFavoritesOption}
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
