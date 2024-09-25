import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { t } from 'lib/i18n';
import { filterNetworksByName } from 'lib/ui/filter-networks-by-name';
import { useBooleanState } from 'lib/ui/hooks';
import { SettingsTabProps } from 'lib/ui/settings-tab-props';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { useBlockExplorers } from 'temple/front/block-explorers';
import { useEvmChainsSpecs, useTezosChainsSpecs } from 'temple/front/chains-specs';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { AddNetworkModal } from './add-network-modal';
import { ChainsGroupView } from './chains-group-view';
import { FiltersBlock } from './filters-block';

interface ChainsFilters {
  kind?: TempleChainKind;
  isDefault?: boolean;
}

export const NetworksSettings = memo<SettingsTabProps>(({ setHeaderChildren }) => {
  const tezosChainsRecord = useAllTezosChains();
  const evmChainsRecord = useAllEvmChains();
  const [tezChainsSpecs] = useTezosChainsSpecs();
  const [evmChainsSpecs] = useEvmChainsSpecs();
  const { allBlockExplorers } = useBlockExplorers();
  console.log('oy vey 1', { tezosChainsRecord, evmChainsRecord, tezChainsSpecs, evmChainsSpecs, allBlockExplorers });

  const [isMainnetTab, openMainnetTab, openTestnetTab] = useBooleanState(true);
  const [isAddNetworkModalOpen, openAddNetworkModal, closeAddNetworkModal] = useBooleanState(false);
  const [searchValue, setSearchValue] = useState('');

  const allChains = useMemo(
    () => [...Object.values(tezosChainsRecord), ...Object.values(evmChainsRecord)],
    [evmChainsRecord, tezosChainsRecord]
  );
  const matchingChains = useMemo(() => filterNetworksByName(allChains, searchValue), [allChains, searchValue]);

  const pickChains = useCallback(
    ({ kind, isDefault }: ChainsFilters) =>
      matchingChains.filter(
        chain =>
          (!kind || chain.kind === kind) &&
          (isDefault === undefined || isDefault === chain.default) &&
          isMainnetTab === chain.mainnet
      ),
    [isMainnetTab, matchingChains]
  );

  const chainsGroups = useMemo(() => {
    const customChainsGroup = {
      title: t('customNetworksGroup'),
      chains: pickChains({ isDefault: false })
    };

    if (isMainnetTab) {
      return [
        {
          title: t('defaultNetworksGroup'),
          chains: pickChains({ isDefault: true })
        },
        customChainsGroup
      ].filter(({ chains }) => chains.length > 0);
    }

    return [
      {
        title: TempleChainTitle[TempleChainKind.EVM],
        chains: pickChains({ isDefault: true, kind: TempleChainKind.EVM })
      },
      {
        title: TempleChainTitle[TempleChainKind.Tezos],
        chains: pickChains({ isDefault: true, kind: TempleChainKind.Tezos })
      },
      customChainsGroup
    ].filter(({ chains }) => chains.length > 0);
  }, [isMainnetTab, pickChains]);

  const headerChildren = useMemo(
    () => (
      <FiltersBlock
        searchValue={searchValue}
        isMainnetTab={isMainnetTab}
        openMainnetTab={openMainnetTab}
        openTestnetTab={openTestnetTab}
        setSearchValue={setSearchValue}
        onAddNetworkClick={openAddNetworkModal}
      />
    ),
    [isMainnetTab, openAddNetworkModal, openMainnetTab, openTestnetTab, searchValue]
  );
  useEffect(() => setHeaderChildren(headerChildren), [headerChildren, setHeaderChildren]);
  useEffect(() => {
    return () => setHeaderChildren(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {chainsGroups.length === 0 ? (
        <div className="w-full h-full flex items-center">
          <EmptyState variant="searchUniversal" />
        </div>
      ) : (
        <div className="flex flex-col gap-y-4 -m-4 px-4 pb-4 overflow-y-auto">
          {chainsGroups.map((group, i) => (
            <ChainsGroupView className={i === chainsGroups.length - 1 ? 'mb-4' : ''} key={group.title} group={group} />
          ))}
        </div>
      )}
      <AddNetworkModal isOpen={isAddNetworkModalOpen} onClose={closeAddNetworkModal} />
    </>
  );
});
