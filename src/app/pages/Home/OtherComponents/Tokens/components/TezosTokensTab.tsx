import { Activity, createContext, FC, useContext, useMemo, useRef } from 'react';

import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosAccountTokensForListing,
  useTezosAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  getTokenElementIndex,
  getGroupedTokenElementIndex,
  TokenListItemElement,
  useTokenWillBeRendered
} from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useRenderPromo } from '../utils';

import { TokensTabBase } from './tokens-tab-base';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from './tokens-views';

interface Props {
  publicKeyHash: string;
  accountId: string;
}

const TezosTokensTabContext = createContext<Props>({
  publicKeyHash: '',
  accountId: ''
});

export const TezosTokensTab: FC<Props> = props => {
  const { manageActive } = useTokensManageState();

  return (
    <TezosTokensTabContext value={props}>
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

  const allTezosTokensSlugs = useMemo(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
    [tokens]
  );

  const allTezosTokensSlugsSorted = useMemoWithCompare(
    () => allTezosTokensSlugs.sort(tokensSortPredicate),
    [allTezosTokensSlugs, tokensSortPredicate]
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

interface TabContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.Tezos> | null;
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
  const { publicKeyHash, accountId } = useContext(TezosTokensTabContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const { displayedSlugs, displayedGroupedSlugs, isSyncing, isInSearchMode, loadNextGrouped, loadNextPlain } =
    useTezosAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

  const mainnetChain = useTezosMainnetChain();
  const tezosChains = useAllTezosChains();
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tokenWillBeRendered = useTokenWillBeRendered();

  const TokenListItem: TokenListItemFC = ({ chainSlug, ref, index }) => {
    const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

    return (
      <TezosTokenListItem
        network={tezosChains[chainId]}
        index={index}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        manageActive={manageActive}
        ref={ref}
      />
    );
  };

  const getElementIndex = (y: number) =>
    displayedGroupedSlugs
      ? getGroupedTokenElementIndex(
          promoRef.current,
          firstListItemRef.current,
          firstHeaderRef.current,
          displayedGroupedSlugs,
          tokenWillBeRendered,
          y
        )
      : getTokenElementIndex(promoRef.current, firstListItemRef.current, displayedSlugs, tokenWillBeRendered, y);

  const Promo = useRenderPromo(manageActive, promoRef);

  return (
    <TokensTabBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    >
      {displayedGroupedSlugs ? (
        <GroupedTokensViewWithPromo
          groupedSlugs={displayedGroupedSlugs}
          tezosChains={tezosChains}
          Promo={Promo}
          firstListItemRef={firstListItemRef}
          firstHeaderRef={firstHeaderRef}
          TokenListItem={TokenListItem}
        />
      ) : (
        <TokensViewWithPromo
          displayedSlugs={displayedSlugs}
          Promo={Promo}
          firstListItemRef={firstListItemRef}
          TokenListItem={TokenListItem}
        />
      )}
    </TokensTabBase>
  );
};
