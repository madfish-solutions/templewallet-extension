import React, { memo, useCallback, useState, MouseEvent, Suspense, useEffect, useMemo, FC } from 'react';

import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { isFilterChain } from 'app/pages/Swap/form/utils';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { NetworkPopper } from 'app/templates/network-popper';
import { FAVORITES } from 'app/templates/network-popper/constants';
import { SearchBarField } from 'app/templates/SearchField';
import { LifiSupportedChains } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { t } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
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
  chainId?: number | string | null;
  chainKind: TempleChainKind.EVM | TempleChainKind.Tezos | null;
}

export const SwapSelectAssetModal = memo<SelectTokenModalProps>(
  ({ activeField, onAssetSelect, opened, onRequestClose, chainId, chainKind }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const evmNetwork = useEvmChainByChainId((chainId as number) || ETHEREUM_MAINNET_CHAIN_ID)!;
    const tezosNetwork = useTezosMainnetChain();

    const stableEvmNetwork = useMemoWithCompare(() => evmNetwork, [evmNetwork]);
    const stableTezosNetwork = useMemoWithCompare(() => tezosNetwork, [tezosNetwork]);

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

    useEffect(() => {
      if (!opened) {
        return;
      }
      if (activeField === 'output') {
        setLocalFilterChain(chainKind === TempleChainKind.EVM ? stableEvmNetwork : stableTezosNetwork);
      } else {
        setLocalFilterChain(filterChain);
      }
    }, [activeField, chainKind, stableEvmNetwork, filterChain, opened, stableTezosNetwork]);

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

      if ((!localFilterChain || localFilterChain === FAVORITES) && accountTezAddress && accountEvmAddress) {
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

    const handleFilterOptionSelect = useCallback(
      (filterChain: FilterChain | string) => setLocalFilterChain(filterChain),
      []
    );

    return (
      <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
        {() => (
          <>
            <div className="flex flex-col px-4 pt-4 pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-font-description-bold">{t('filterByNetwork')}</span>
                <FilterNetworkPopper
                  showFavoritesOption={activeField === 'output'}
                  selectedOption={localFilterChain}
                  onOptionSelect={handleFilterOptionSelect}
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
          </>
        )}
      </PageModal>
    );
  }
);

interface FilterNetworkPopperProps {
  selectedOption: FilterChain | string;
  onOptionSelect: (filterChain: FilterChain | string) => void;
  showFavoritesOption: boolean;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(
  ({ selectedOption, onOptionSelect, showFavoritesOption }) => (
    <NetworkPopper
      selectedOption={selectedOption}
      onOptionSelect={onOptionSelect}
      showAllNetworksOption
      showFavoritesOption={showFavoritesOption}
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
  )
);

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <PageLoader className="w-20" />
  </div>
);
