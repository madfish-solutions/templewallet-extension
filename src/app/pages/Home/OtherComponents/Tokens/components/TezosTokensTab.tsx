import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import {
  useTezosAccountTokensForListing,
  useTezosAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  makeGetTokenElementIndexFunction,
  makeGroupedTokenElementIndexFunction,
  TokenListItemElement
} from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { getGroupedTokensViewWithPromo, getTokensViewWithPromo } from '../utils';

import { TokensTabBase } from './tokens-tab-base';

interface Props {
  publicKeyHash: string;
  accountId: string;
}

const TezosTokensTabContext = createContext<Props>({
  publicKeyHash: '',
  accountId: ''
});

export const TezosTokensTab = memo<Props>(props => {
  const { manageActive } = useAssetsViewState();

  return (
    <TezosTokensTabContext.Provider value={props}>
      {manageActive ? <TabContentWithManageActive /> : <TabContent />}
    </TezosTokensTabContext.Provider>
  );
});

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

const TabContentBase = memo<TabContentBaseProps>(
  ({ allSlugsSorted, allSlugsSortedGrouped, groupByNetwork, manageActive, shouldShowHiddenTokensHint }) => {
    const { publicKeyHash, accountId } = useContext(TezosTokensTabContext);
    const promoRef = useRef<HTMLDivElement>(null);
    const firstHeaderRef = useRef<HTMLDivElement>(null);
    const firstListItemRef = useRef<TokenListItemElement>(null);
    const {
      displayedSlugs,
      displayedGroupedSlugs,
      isSyncing,
      isInSearchMode,
      loadNextGrouped,
      loadNextPlain
    } = useTezosAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

    const mainnetChain = useTezosMainnetChain();
    const tezosChains = useAllTezosChains();
    const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

    const { tokensView, getElementIndex } = useMemo(() => {
      const promoJsx = manageActive ? null : (
        <PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionVariant.Text}
          pageName="Token page"
          ref={promoRef}
        />
      );

      if (displayedGroupedSlugs) {
        return {
          tokensView: getGroupedTokensViewWithPromo({
            groupedSlugs: displayedGroupedSlugs,
            tezosChains,
            promoJsx,
            firstListItemRef,
            firstHeaderRef,
            buildTokensJsxArray
          }),
          getElementIndex: makeGroupedTokenElementIndexFunction(
            promoRef,
            firstListItemRef,
            firstHeaderRef,
            displayedGroupedSlugs
          )
        };
      }

      const tokensJsx = buildTokensJsxArray(displayedSlugs, firstListItemRef);

      return {
        tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
        getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
      };

      function buildTokensJsxArray(
        chainSlugs: string[],
        firstListItemRef: React.RefObject<TokenListItemElement> | null,
        indexShift = 0
      ) {
        return chainSlugs.map((chainSlug, i) => {
          const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

          return (
            <TezosTokenListItem
              network={tezosChains[chainId]}
              index={i + indexShift}
              key={chainSlug}
              publicKeyHash={publicKeyHash}
              assetSlug={assetSlug}
              scam={mainnetTokensScamSlugsRecord[assetSlug]}
              manageActive={manageActive}
              ref={i === 0 ? firstListItemRef : null}
            />
          );
        });
      }
    }, [displayedGroupedSlugs, displayedSlugs, tezosChains, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

    return (
      <TokensTabBase
        accountId={accountId}
        tokensCount={displayedSlugs.length}
        getElementIndex={getElementIndex}
        loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
        isSyncing={isSyncing}
        isInSearchMode={isInSearchMode}
        network={mainnetChain}
        shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      >
        {tokensView}
      </TokensTabBase>
    );
  }
);
