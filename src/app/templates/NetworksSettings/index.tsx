import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import { MAIN_CHAINS_IDS } from 'lib/constants';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { searchAndFilterChains } from 'lib/ui/search-networks';
import { SettingsTabProps } from 'lib/ui/settings-tab-props';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { isPossibleTestnetChain } from 'temple/front/chains';
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

  const { value: isTestnetTab, setTrue: openTestnetTab, setFalse: openMainnetTab } = useSearchParamsBoolean('testnet');
  const [isAddNetworkModalOpen, openAddNetworkModal, closeAddNetworkModal] = useBooleanState(false);
  const [searchValue, setSearchValue] = useState('');

  const allChains = useMemo(
    () =>
      [...Object.values(tezosChainsRecord), ...Object.values(evmChainsRecord)].sort(
        ({ chainId: aChainId }, { chainId: bChainId }) =>
          MAIN_CHAINS_IDS.indexOf(bChainId) - MAIN_CHAINS_IDS.indexOf(aChainId)
      ),
    [evmChainsRecord, tezosChainsRecord]
  );
  const matchingChains = useMemo(() => searchAndFilterChains(allChains, searchValue), [allChains, searchValue]);

  const pickChains = useCallback(
    ({ kind, isDefault }: ChainsFilters) =>
      matchingChains.filter(
        chain =>
          (!kind || chain.kind === kind) &&
          (isDefault === undefined || isDefault === chain.default) &&
          isTestnetTab === isPossibleTestnetChain(chain)
      ),
    [isTestnetTab, matchingChains]
  );

  const chainsGroups = useMemo(
    () =>
      (isTestnetTab
        ? [
            {
              title: t('chainTestnetsGroup', TempleChainTitle[TempleChainKind.EVM]),
              chains: pickChains({ isDefault: true, kind: TempleChainKind.EVM })
            },
            {
              title: t('chainTestnetsGroup', TempleChainTitle[TempleChainKind.Tezos]),
              chains: pickChains({ isDefault: true, kind: TempleChainKind.Tezos })
            },
            {
              title: t('customTestnetsGroup'),
              chains: pickChains({ isDefault: false })
            }
          ]
        : [
            {
              title: t('defaultNetworksGroup'),
              chains: pickChains({ isDefault: true })
            },
            {
              title: t('customNetworksGroup'),
              chains: pickChains({ isDefault: false })
            }
          ]
      ).filter(({ chains }) => chains.length > 0),
    [isTestnetTab, pickChains]
  );

  const headerChildren = useMemo(
    () => (
      <FiltersBlock
        searchValue={searchValue}
        isTestnetTab={isTestnetTab}
        openMainnetTab={openMainnetTab}
        openTestnetTab={openTestnetTab}
        setSearchValue={setSearchValue}
        onAddNetworkClick={openAddNetworkModal}
      />
    ),
    [isTestnetTab, openAddNetworkModal, openMainnetTab, openTestnetTab, searchValue]
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
          <EmptyState />
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
