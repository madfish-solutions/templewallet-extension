import { Activity, FC, useContext } from 'react';

import { useEvmAccountTokensForListing } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
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
import { useEvmAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useEvmAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { toNotRemovedChainTokensSlugs } from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { TempleChainKind } from 'temple/types';

import { TabContentBase } from './content-base';
import { EvmTokensTabContext } from './context';
import { EvmTokensTabProps } from './types';

export const EvmTokensTab: FC<EvmTokensTabProps> = ({ publicKeyHash, accountId }) => {
  const { manageActive } = useTokensManageState();
  const evmCollectibles = useEvmAccountCollectibles(publicKeyHash);
  const balancesLoading = useEvmBalancesAreLoading();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesReady = evmCollectibles.length > 0 || (!balancesLoading && !collectiblesMetadataLoading);
  const collectiblesSortPredicate = useEvmAccountCollectiblesSortPredicate(publicKeyHash);
  const contextValue = { publicKeyHash, accountId, evmCollectibles, collectiblesReady, collectiblesSortPredicate };

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  return (
    <EvmTokensTabContext value={contextValue}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="evm-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="evm-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </EvmTokensTabContext>
  );
};

const TabContent: FC = () => {
  const { publicKeyHash } = useContext(EvmTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useEvmAccountTokensForListing(publicKeyHash, hideSmallBalance, groupByNetwork);

  return (
    <TabContentBase
      manageActive={false}
      groupByNetwork={groupByNetwork}
      allSlugsSorted={enabledChainSlugsSorted}
      allSlugsSortedGrouped={enabledChainSlugsSortedGrouped}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { publicKeyHash } = useContext(EvmTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, tokens, tokensSortPredicate } =
    useEvmAccountTokensForListing(publicKeyHash, hideSmallBalance, groupByNetwork);

  const allChainsSlugsSorted = useMemoWithCompare(
    () => toNotRemovedChainTokensSlugs(tokens, TempleChainKind.EVM).sort(tokensSortPredicate),
    [tokens, tokensSortPredicate]
  );
  const allChainsSlugsSortedGrouped = useMemoWithCompare(
    () => groupByToEntries(allChainsSlugsSorted, slug => parseChainAssetSlug(slug, TempleChainKind.EVM)[1]),
    [allChainsSlugsSorted]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainSlugsSorted, allChainsSlugsSorted);
  const allSlugsSortedGrouped = usePreservedOrderSlugsGroupsToManage<TempleChainKind.EVM>(
    enabledChainSlugsSortedGrouped,
    allChainsSlugsSortedGrouped
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
