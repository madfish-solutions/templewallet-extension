import { Activity, FC, useContext } from 'react';

import {
  useAccountTokensForListing,
  useAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useEvmCollectiblesMetadataLoading } from 'app/hooks/use-evm-collectibles-meta-loading';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import {
  toTezEnabledCollectiblesChainSlugs,
  useEvmAccountCollectibles,
  useTezosAccountCollectibles
} from 'lib/assets/hooks/collectibles';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { toNotRemovedChainTokensSlugs } from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TabContentBaseBody } from './content-base-body';
import { MultiChainTokensTabContext } from './context';
import { MultiChainTokensTabProps } from './types';

export const MultiChainTokensTab: FC<MultiChainTokensTabProps> = ({
  accountEvmAddress,
  accountTezAddress,
  accountId
}) => {
  const { manageActive } = useTokensManageState();

  const tezosCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectibles = useEvmAccountCollectibles(accountEvmAddress);
  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmCollectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesSortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);
  const collectiblesReady =
    (tezosCollectibles.length > 0 || !tezAssetsLoading) &&
    (evmCollectibles.length > 0 || (!evmBalancesLoading && !evmCollectiblesMetadataLoading));
  const contextValue = {
    accountId,
    accountEvmAddress,
    accountTezAddress,
    tezosCollectibles,
    evmCollectibles,
    collectiblesReady,
    collectiblesSortPredicate
  };

  const tezEnabledCollectiblesChainsSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);
  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return (
    <MultiChainTokensTabContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="multichain-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="multichain-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </MultiChainTokensTabContext>
  );
};

const TabContent: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useAccountTokensForListing(accountTezAddress, accountEvmAddress, hideSmallBalance, groupByNetwork);

  return (
    <TabContentBase
      manageActive={false}
      groupByNetwork={groupByNetwork}
      allSlugsSorted={enabledChainsSlugsSorted}
      allSlugsSortedGrouped={enabledChainsSlugsSortedGrouped}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped, tezTokens, evmTokens, tokensSortPredicate } =
    useAccountTokensForListing(accountTezAddress, accountEvmAddress, hideSmallBalance, groupByNetwork);

  const otherChainSlugsSorted = useMemoWithCompare(
    () =>
      toNotRemovedChainTokensSlugs(tezTokens, TempleChainKind.Tezos)
        .concat(toNotRemovedChainTokensSlugs(evmTokens, TempleChainKind.EVM))
        .sort(tokensSortPredicate),
    [tezTokens, evmTokens, tokensSortPredicate]
  );
  const otherChainSlugsSortedGrouped = useMemoWithCompare(
    () => groupByToEntries(otherChainSlugsSorted, slug => parseChainAssetSlug(slug)[1]),
    [otherChainSlugsSorted]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainsSlugsSorted, otherChainSlugsSorted);
  const allSlugsSortedGrouped = usePreservedOrderSlugsGroupsToManage(
    enabledChainsSlugsSortedGrouped,
    otherChainSlugsSortedGrouped
  );

  return (
    <TabContentBase
      allSlugsSorted={allSlugsSorted}
      allSlugsSortedGrouped={allSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs | null;
  groupByNetwork: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

const TabContentBase: FC<TabContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  groupByNetwork,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const { displayedSlugs, displayedGroupedSlugs, isSyncing, loadNextPlain, loadNextGrouped, isInSearchMode } =
    useAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  return (
    <TabContentBaseBody
      isInSearchMode={isInSearchMode}
      isSyncingTokens={isSyncing}
      displayedSlugs={displayedSlugs}
      loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
      groupedSlugs={displayedGroupedSlugs}
      tezosChains={tezosChains}
      evmChains={evmChains}
      manageActive={manageActive}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};
