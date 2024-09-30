import React, { memo, useMemo, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import {
  ActivityListContainer,
  EvmActivityList,
  TezosActivityList,
  MultichainActivityList
} from 'app/templates/activity';
import { NetworkSelectModalContent } from 'app/templates/NetworkSelectModal';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const ActivityPage = memo(() => {
  const { filterChain: initFilterChain } = useAssetsFilterOptionsSelector();

  const [filterChain, setFilterChain] = useState<FilterChain>(initFilterChain);

  const [filtersModalOpen, setFiltersModalOpen, setFiltersModalClosed] = useBooleanState(false);

  const handleChainChange = useMemo(
    () =>
      initFilterChain
        ? undefined
        : (chain: FilterChain) => {
            setFilterChain(chain);
            setFiltersModalClosed();
          },
    []
  );

  return (
    <PageLayout
      pageTitle="Activity"
      headerRightElem={
        <IconBase Icon={FilterOffIcon} className="text-primary cursor-pointer" onClick={setFiltersModalOpen} />
      }
    >
      <FiltersModal
        open={filtersModalOpen}
        filterChain={filterChain}
        handleChainChange={handleChainChange}
        onRequestClose={setFiltersModalClosed}
      />

      {filterChain ? (
        <ActivityListContainer chainId={filterChain.chainId}>
          {filterChain.kind === 'tezos' ? (
            <TezosActivityList tezosChainId={filterChain.chainId} />
          ) : (
            <EvmActivityList chainId={filterChain.chainId} />
          )}
        </ActivityListContainer>
      ) : (
        <MultichainActivityList />
      )}
    </PageLayout>
  );
});

interface FiltersModalProps {
  open: boolean;
  filterChain: FilterChain;
  handleChainChange?: (chain: FilterChain) => void;
  onRequestClose: EmptyFn;
}

const FiltersModal = memo<FiltersModalProps>(({ open, filterChain, handleChainChange, onRequestClose }) => {
  const [networksMode, setModeToNetworks, setModeToFilters] = useBooleanState(false);

  return (
    <PageModal
      title={networksMode ? 'Select Network' : 'Filter Activity'}
      opened={open}
      contentPadding
      shouldShowBackButton={networksMode}
      onGoBack={setModeToFilters}
      onRequestClose={onRequestClose}
    >
      {networksMode && handleChainChange ? (
        <NetworkSelectModalContent
          opened={open}
          selectedNetwork={filterChain}
          handleNetworkSelect={chain => {
            handleChainChange(chain);
            setModeToFilters();
          }}
        />
      ) : (
        <FiltersMainContent
          filterChain={filterChain}
          onOpenNetworksClick={handleChainChange ? setModeToNetworks : undefined}
        />
      )}
    </PageModal>
  );
});

interface FiltersMainContentProps {
  filterChain: FilterChain;
  onOpenNetworksClick?: EmptyFn;
}

const FiltersMainContent = memo<FiltersMainContentProps>(({ filterChain, onOpenNetworksClick }) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  const chain = useMemo(() => {
    if (!filterChain) return null;

    if (filterChain.kind === TempleChainKind.Tezos) return tezosChains[filterChain.chainId];

    return evmChains[filterChain.chainId];
  }, [filterChain, evmChains, tezosChains]);

  const disabledNetworkChange = !onOpenNetworksClick;

  return (
    <>
      <div className="flex align-center justify-between pl-1 py-0.5">
        <span className="text-font-description-bold">Filter by network</span>

        <TextButton
          Icon={CompactDownIcon}
          onClick={onOpenNetworksClick}
          className={disabledNetworkChange ? 'opacity-50 pointer-events-none' : undefined}
        >
          {chain ? chain.nameI18nKey ? <T id={chain.nameI18nKey} /> : chain.name : 'All Networks'}
        </TextButton>
      </div>

      <div className="mt-1 flex flex-col">Filters by activity kind</div>
    </>
  );
});
