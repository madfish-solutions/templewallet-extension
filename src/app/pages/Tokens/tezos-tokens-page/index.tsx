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
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { toNotRemovedChainTokensSlugs } from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { TempleChainKind } from 'temple/types';

import { TokensPageWrapper } from '../tokens-page-wrapper';
import { useEnsureTezosCollectibles } from '../use-ensure-tezos-collectibles';

import { PageContentBase } from './content-base';
import { TezosTokensPageContext } from './context';
import { TezosTokensPageProps } from './types';

export const TezosTokensPage: FC<TezosTokensPageProps> = ({ publicKeyHash, accountId }) => {
  const { manageActive, toggleManageActive } = useTokensManageState();
  useEnsureTezosCollectibles(publicKeyHash);

  return (
    <TokensPageWrapper manageActive={manageActive} toggleManageActive={toggleManageActive}>
      <TezosTokensPageContext value={{ publicKeyHash, accountId }}>
        <Activity mode={manageActive ? 'hidden' : 'visible'} name="tezos-tokens-page-default">
          <PageContent />
        </Activity>

        <Activity mode={manageActive ? 'visible' : 'hidden'} name="tezos-tokens-page-manage">
          <PageContentWithManageActive />
        </Activity>
      </TezosTokensPageContext>
    </TokensPageWrapper>
  );
};

const PageContent: FC = () => {
  const { publicKeyHash } = useContext(TezosTokensPageContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useTezosAccountTokensForListing(publicKeyHash, hideSmallBalance, groupByNetwork);

  return (
    <PageContentBase
      manageActive={false}
      groupByNetwork={groupByNetwork}
      allSlugsSorted={enabledChainSlugsSorted}
      allSlugsSortedGrouped={enabledChainSlugsSortedGrouped}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const PageContentWithManageActive: FC = () => {
  const { publicKeyHash } = useContext(TezosTokensPageContext);
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
    <PageContentBase
      allSlugsSorted={allSlugsSorted}
      allSlugsSortedGrouped={allSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};
