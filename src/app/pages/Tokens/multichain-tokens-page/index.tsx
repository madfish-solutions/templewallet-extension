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

import { PageContentBaseBody } from './content-base-body';
import { MultiChainTokensPageContext } from './context';
import { MultiChainTokensPageProps } from './types';

export const MultiChainTokensPage: FC<MultiChainTokensPageProps> = ({
  accountEvmAddress,
  accountTezAddress,
  accountId
}) => {
  const { manageActive, toggleManageActive } = useTokensManageState();

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
    collectiblesSortPredicate,
    toggleManageActive
  };

  const tezEnabledCollectiblesChainsSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);
  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return (
    <MultiChainTokensPageContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="multichain-tokens-page-default">
        <PageContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="multichain-tokens-page-manage">
        <PageContentWithManageActive />
      </Activity>
    </MultiChainTokensPageContext>
  );
};

const PageContent: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensPageContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useAccountTokensForListing(accountTezAddress, accountEvmAddress, hideSmallBalance, groupByNetwork);

  return (
    <PageContentBase
      manageActive={false}
      groupByNetwork={groupByNetwork}
      allSlugsSorted={enabledChainsSlugsSorted}
      allSlugsSortedGrouped={enabledChainsSlugsSortedGrouped}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const PageContentWithManageActive: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensPageContext);
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
    <PageContentBase
      allSlugsSorted={allSlugsSorted}
      allSlugsSortedGrouped={allSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface PageContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs | null;
  groupByNetwork: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

const PageContentBase: FC<PageContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  groupByNetwork,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const {
    applicableNetworks,
    displayedSlugs,
    displayedGroupedSlugs,
    isSyncing,
    loadNextPlain,
    loadNextGrouped,
    isInSearchMode
  } = useAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  return (
    <PageContentBaseBody
      applicableNetworks={applicableNetworks}
      isInSearchMode={isInSearchMode}
      isSyncing={isSyncing}
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
