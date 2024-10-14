import React, { memo, useCallback, useMemo, useState } from 'react';

import { noop } from 'lodash';

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
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import Popper from 'lib/ui/Popper';
import { OneOfChains, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SettingsCell } from '../../atoms/SettingsCell';

import { FilterChainDropdown } from './FilterChainDropdown';

export const ActivityPage = memo(() => {
  const { filterChain: initFilterChain } = useAssetsFilterOptionsSelector();

  const [filterChain, setFilterChain] = useState<FilterChain>(initFilterChain);

  const [filterKind, setFilterKind] = useState<FilterKind>(null);

  const [filtersModalOpen, setFiltersModalOpen, setFiltersModalClosed] = useBooleanState(false);

  const handleFilterChainSelect = useMemo(
    () =>
      initFilterChain
        ? undefined
        : (chain: OneOfChains | null) => {
            setFilterChain(chain);
            setFiltersModalClosed();
          },
    [setFiltersModalClosed]
  );

  const handleFilterKindSelect = useCallback(
    (kind: FilterKind) => {
      setFilterKind(kind);
      if (kind !== filterKind) setFiltersModalClosed();
    },
    [filterKind, setFiltersModalClosed]
  );

  return (
    <PageLayout
      pageTitle="Activity"
      contentPadding={false}
      headerRightElem={
        <IconBase Icon={FilterOffIcon} className="text-primary cursor-pointer" onClick={setFiltersModalOpen} />
      }
    >
      <FiltersModal
        open={filtersModalOpen}
        filterKind={filterKind}
        filterChain={filterChain}
        handleFilterChainSelect={handleFilterChainSelect}
        handleFilterKindSelect={handleFilterKindSelect}
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
        <ActivityListContainer>
          <MultichainActivityList filterKind={filterKind} />
        </ActivityListContainer>
      )}
    </PageLayout>
  );
});

interface FiltersModalProps {
  open: boolean;
  filterKind: FilterKind;
  filterChain: FilterChain;
  handleFilterChainSelect?: SyncFn<OneOfChains | null>;
  handleFilterKindSelect: SyncFn<FilterKind>;
  onRequestClose: EmptyFn;
}

const FiltersModal = memo<FiltersModalProps>(
  ({ open, filterKind, filterChain, handleFilterChainSelect, handleFilterKindSelect, onRequestClose }) => {
    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    const chain = useMemo(() => {
      if (!filterChain) return null;

      if (filterChain.kind === TempleChainKind.Tezos) return tezosChains[filterChain.chainId];

      return evmChains[filterChain.chainId];
    }, [filterChain, evmChains, tezosChains]);

    return (
      <PageModal title="Filter Activity" opened={open} contentPadding onRequestClose={onRequestClose}>
        <div className="flex align-center justify-between pl-1 py-0.5">
          <span className="text-font-description-bold">Filter by network</span>

          <Popper
            placement="bottom-end"
            strategy="fixed"
            popup={props => (
              <FilterChainDropdown
                filterChain={filterChain}
                setFilterChain={handleFilterChainSelect ?? noop}
                {...props}
              />
            )}
          >
            {({ ref, toggleOpened }) => (
              <TextButton
                ref={ref}
                Icon={CompactDownIcon}
                onClick={handleFilterChainSelect ? toggleOpened : undefined}
                className={handleFilterChainSelect ? undefined : 'opacity-50 pointer-events-none'}
              >
                {chain ? chain.nameI18nKey ? <T id={chain.nameI18nKey} /> : chain.name : 'All Networks'}
              </TextButton>
            )}
          </Popper>
        </div>

        <div className="mt-1 flex flex-col rounded-lg overflow-hidden shadow-center">
          <SettingsCell
            title="All Activity"
            icon={<RadioButton active={!filterKind} />}
            onClick={() => handleFilterKindSelect(null)}
            first
          />

          <SettingsCell
            title="Send"
            icon={<RadioButton active={filterKind === 'send'} />}
            onClick={() => handleFilterKindSelect('send')}
          />

          <SettingsCell
            title="Receive"
            icon={<RadioButton active={filterKind === 'receive'} />}
            onClick={() => handleFilterKindSelect('receive')}
          />

          <SettingsCell
            title="Approve"
            icon={<RadioButton active={filterKind === 'approve'} />}
            onClick={() => handleFilterKindSelect('approve')}
          />

          <SettingsCell
            title="Transfer"
            icon={<RadioButton active={filterKind === 'transfer'} />}
            onClick={() => handleFilterKindSelect('transfer')}
          />

          <SettingsCell
            title="Bundle"
            icon={<RadioButton active={filterKind === 'bundle'} />}
            onClick={() => handleFilterKindSelect('bundle')}
          />
        </div>
      </PageModal>
    );
  }
);
