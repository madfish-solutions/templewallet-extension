import React, { memo, useCallback, useMemo, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
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
  MultichainActivityList,
  FilterKind
} from 'app/templates/activity';
import { NetworkSelectModalContent } from 'app/templates/NetworkSelectModal';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SettingsCell } from '../../atoms/SettingsCell';

export const ActivityPage = memo(() => {
  const { filterChain: initFilterChain } = useAssetsFilterOptionsSelector();

  const [filterChain, setFilterChain] = useState<FilterChain>(initFilterChain);

  const [filterKind, setFilterKind] = useState<FilterKind>(null);

  const [filtersModalOpen, setFiltersModalOpen, setFiltersModalClosed] = useBooleanState(false);

  const handleFilterKindChange = useCallback(
    (kind: FilterKind) => {
      setFilterKind(kind);
      if (kind !== filterKind) setFiltersModalClosed();
    },
    [filterKind]
  );

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
        filterKind={filterKind}
        filterChain={filterChain}
        handleFilterKindChange={handleFilterKindChange}
        handleChainChange={handleChainChange}
        onRequestClose={setFiltersModalClosed}
      />

      {filterChain ? (
        <ActivityListContainer chainId={filterChain.chainId}>
          {filterChain.kind === 'tezos' ? (
            <TezosActivityList tezosChainId={filterChain.chainId} filterKind={filterKind} />
          ) : (
            <EvmActivityList chainId={filterChain.chainId} filterKind={filterKind} />
          )}
        </ActivityListContainer>
      ) : (
        <MultichainActivityList filterKind={filterKind} />
      )}
    </PageLayout>
  );
});

interface FiltersModalProps {
  open: boolean;
  filterKind: FilterKind;
  filterChain: FilterChain;
  handleFilterKindChange: SyncFn<FilterKind>;
  handleChainChange?: (chain: FilterChain) => void;
  onRequestClose: EmptyFn;
}

const FiltersModal = memo<FiltersModalProps>(
  ({ open, filterKind, filterChain, handleFilterKindChange, handleChainChange, onRequestClose }) => {
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
            filterKind={filterKind}
            filterChain={filterChain}
            handleFilterKindChange={handleFilterKindChange}
            onOpenNetworksClick={handleChainChange ? setModeToNetworks : undefined}
          />
        )}
      </PageModal>
    );
  }
);

interface FiltersMainContentProps {
  filterKind: FilterKind;
  filterChain: FilterChain;
  handleFilterKindChange: SyncFn<FilterKind>;
  onOpenNetworksClick?: EmptyFn;
}

const FiltersMainContent = memo<FiltersMainContentProps>(
  ({ filterKind, filterChain, handleFilterKindChange, onOpenNetworksClick }) => {
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

        <div className="mt-1 flex flex-col rounded-lg overflow-hidden shadow-center">
          <SettingsCell
            title="All Activity"
            icon={<RadioButton active={!filterKind} />}
            onClick={() => handleFilterKindChange(null)}
            first
          />

          <SettingsCell
            title="Send"
            icon={<RadioButton active={filterKind === 'send'} />}
            onClick={() => handleFilterKindChange('send')}
          />

          <SettingsCell
            title="Receive"
            icon={<RadioButton active={filterKind === 'receive'} />}
            onClick={() => handleFilterKindChange('receive')}
          />

          <SettingsCell
            title="Approve"
            icon={<RadioButton active={filterKind === 'approve'} />}
            onClick={() => handleFilterKindChange('approve')}
          />

          <SettingsCell
            title="Transfer"
            icon={<RadioButton active={filterKind === 'transfer'} />}
            onClick={() => handleFilterKindChange('transfer')}
          />

          <SettingsCell
            title="Bundle"
            icon={<RadioButton active={filterKind === 'bundle'} />}
            onClick={() => handleFilterKindChange('bundle')}
          />
        </div>
      </>
    );
  }
);
