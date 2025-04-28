import React, { FC, RefObject, memo, useMemo, useRef } from 'react';

import {
  useEvmAccountTokensForListing,
  useEvmAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  TokenListItemElement,
  makeGetTokenElementIndexFunction,
  makeGroupedTokenElementIndexFunction
} from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { getGroupedTokensViewWithPromo, getTokensViewWithPromo } from '../utils';

import { TokensTabBase } from './TokensTabBase';

interface Props {
  publicKeyHash: HexString;
}

export const EvmTokensTab = memo<Props>(({ publicKeyHash }) => {
  const { manageActive } = useAssetsViewState();

  if (manageActive) return <TabContentWithManageActive publicKeyHash={publicKeyHash} />;

  return <TabContent publicKeyHash={publicKeyHash} />;
});

const TabContent: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped } = useEvmAccountTokensForListing(
    publicKeyHash,
    hideZeroBalance,
    groupByNetwork
  );

  return (
    <TabContentBase
      publicKeyHash={publicKeyHash}
      allSlugsSorted={enabledChainSlugsSorted}
      allSlugsSortedGrouped={enabledChainSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC<Props> = ({ publicKeyHash }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted, enabledChainSlugsSortedGrouped, tokens, tokensSortPredicate } =
    useEvmAccountTokensForListing(publicKeyHash, hideZeroBalance, groupByNetwork);

  const allChainsSlugs = useMemo(
    () =>
      tokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug)),
    [tokens]
  );

  const allChainsSlugsSorted = useMemoWithCompare(
    () => allChainsSlugs.sort(tokensSortPredicate),
    [allChainsSlugs, tokensSortPredicate]
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
      publicKeyHash={publicKeyHash}
      allSlugsSorted={allSlugsSorted}
      allSlugsSortedGrouped={allSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  publicKeyHash: HexString;
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.EVM> | null;
  groupByNetwork: boolean;
  manageActive: boolean;
}

const TabContentBase = memo<TabContentBaseProps>(
  ({ publicKeyHash, allSlugsSorted, allSlugsSortedGrouped, groupByNetwork, manageActive }) => {
    const {
      displayedSlugs,
      displayedGroupedSlugs,
      isSyncing,
      loadNextPlain,
      loadNextGrouped,
      searchValue,
      isInSearchMode,
      setSearchValue
    } = useEvmAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);
    const promoRef = useRef<HTMLDivElement>(null);
    const firstHeaderRef = useRef<HTMLDivElement>(null);
    const firstListItemRef = useRef<TokenListItemElement>(null);

    const mainnetChain = useEthereumMainnetChain();
    const evmChains = useAllEvmChains();

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
            evmChains,
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
        firstListItemRef: RefObject<TokenListItemElement> | null,
        indexShift = 0
      ) {
        return chainSlugs.map((chainSlug, i) => {
          const [_, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

          return (
            <EvmTokenListItem
              key={chainSlug}
              network={evmChains[chainId]!}
              index={i + indexShift}
              assetSlug={slug}
              publicKeyHash={publicKeyHash}
              manageActive={manageActive}
              ref={i === 0 ? firstListItemRef : null}
            />
          );
        });
      }
    }, [displayedGroupedSlugs, displayedSlugs, manageActive, evmChains, publicKeyHash]);

    return (
      <TokensTabBase
        tokensCount={displayedSlugs.length}
        searchValue={searchValue}
        getElementIndex={getElementIndex}
        loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
        onSearchValueChange={setSearchValue}
        isSyncing={isSyncing}
        isInSearchMode={isInSearchMode}
        network={mainnetChain}
      >
        {tokensView}
      </TokensTabBase>
    );
  }
);
