import { Activity, FC, useContext } from 'react';

import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTezosAccountTokensForListing } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { toTezEnabledCollectiblesChainSlugs, useTezosAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { toNotRemovedChainTokensSlugs } from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { TempleChainKind } from 'temple/types';

import { TabContentBase } from './content-base';
import { TezosTokensTabContext } from './context';
import { TezosTokensTabProps } from './types';

export const TezosTokensTab: FC<TezosTokensTabProps> = ({ publicKeyHash, accountId }) => {
  const { manageActive } = useTokensManageState();
  const tezosCollectibles = useTezosAccountCollectibles(publicKeyHash);
  const assetsLoading = useAreAssetsLoading('collectibles');
  const collectiblesReady = tezosCollectibles.length > 0 || !assetsLoading;
  const collectiblesSortPredicate = useTezosAccountCollectiblesSortPredicate(publicKeyHash);

  const value = {
    publicKeyHash,
    accountId,
    tezosCollectibles,
    collectiblesReady,
    collectiblesSortPredicate
  };

  const tezEnabledCollectiblesChainsSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  return (
    <TezosTokensTabContext value={value}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="tezos-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="tezos-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </TezosTokensTabContext>
  );
};

const TabContent: FC = () => {
  const { publicKeyHash } = useContext(TezosTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();
  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useTezosAccountTokensForListing(publicKeyHash, hideSmallBalance, groupByNetwork);

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
  const { publicKeyHash } = useContext(TezosTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, tokens, tokensSortPredicate } =
    useTezosAccountTokensForListing(publicKeyHash, hideSmallBalance, groupByNetwork);

  const allTezosTokensSlugsSorted = useMemoWithCompare(
    () => toNotRemovedChainTokensSlugs(tokens, TempleChainKind.Tezos).sort(tokensSortPredicate),
    [tokens, tokensSortPredicate]
  );
  const allTezosTokensSlugsSortedGrouped = useMemoWithCompare(
    () => groupByToEntries(allTezosTokensSlugsSorted, slug => parseChainAssetSlug(slug, TempleChainKind.Tezos)[1]),
    [allTezosTokensSlugsSorted]
  );

  const allSlugsSorted = usePreservedOrderSlugsToManage(enabledChainSlugsSorted, allTezosTokensSlugsSorted);
  const allSlugsSortedGrouped = usePreservedOrderSlugsGroupsToManage<TempleChainKind.Tezos>(
    enabledChainSlugsSortedGrouped,
    allTezosTokensSlugsSortedGrouped
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
