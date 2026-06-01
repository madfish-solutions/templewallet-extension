import { Activity, FC, useContext } from 'react';

import { useEvmAccountTokensForListing } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
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
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { toNotRemovedChainTokensSlugs } from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { TempleChainKind } from 'temple/types';

import { TokensPageWrapper } from '../tokens-page-wrapper';

import { PageContentBase } from './content-base';
import { EvmTokensPageContext } from './context';
import { EvmTokensPageProps } from './types';

export const EvmTokensPage: FC<EvmTokensPageProps> = ({ publicKeyHash, accountId }) => {
  const { manageActive, toggleManageActive } = useTokensManageState();

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  return (
    <TokensPageWrapper manageActive={manageActive} toggleManageActive={toggleManageActive}>
      <EvmTokensPageContext value={{ publicKeyHash, accountId }}>
        <Activity mode={manageActive ? 'hidden' : 'visible'} name="evm-tokens-tab-default">
          <PageContent />
        </Activity>

        <Activity mode={manageActive ? 'visible' : 'hidden'} name="evm-tokens-tab-manage">
          <PageContentWithManageActive />
        </Activity>
      </EvmTokensPageContext>
    </TokensPageWrapper>
  );
};

const PageContent: FC = () => {
  const { publicKeyHash } = useContext(EvmTokensPageContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useEvmAccountTokensForListing(publicKeyHash, hideSmallBalance, groupByNetwork);

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
  const { publicKeyHash } = useContext(EvmTokensPageContext);
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
    <PageContentBase
      allSlugsSorted={allSlugsSorted}
      allSlugsSortedGrouped={allSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};
