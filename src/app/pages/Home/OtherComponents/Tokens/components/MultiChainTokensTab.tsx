import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';

import {
  useAccountTokensForListing,
  useAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  makeGetTokenElementIndexFunction,
  makeGroupedTokenElementIndexFunction,
  TokenListItemElement
} from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { EvmChain, TezosChain, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { getGroupedTokensViewWithPromo, getTokensViewWithPromo } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';

interface Props {
  accountTezAddress: string;
  accountEvmAddress: HexString;
  accountId: string;
}

const MultiChainTokensTabContext = createContext<Props>({
  accountTezAddress: '',
  accountEvmAddress: '0x',
  accountId: ''
});

export const MultiChainTokensTab = memo<Props>(props => {
  const { manageActive } = useAssetsViewState();

  return (
    <MultiChainTokensTabContext.Provider value={props}>
      {manageActive ? <TabContentWithManageActive /> : <TabContent />}
    </MultiChainTokensTabContext.Provider>
  );
});

const TabContent: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensTabContext);
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped } = useAccountTokensForListing(
    accountTezAddress,
    accountEvmAddress,
    hideZeroBalance,
    groupByNetwork
  );

  return (
    <TabContentBase
      allSlugsSorted={enabledChainsSlugsSorted}
      allSlugsSortedGrouped={enabledChainsSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={false}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensTabContext);
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped, tezTokens, evmTokens, tokensSortPredicate } =
    useAccountTokensForListing(accountTezAddress, accountEvmAddress, hideZeroBalance, groupByNetwork);

  const tokensChainsSlugs = useMemo(
    () =>
      tezTokens
        .filter(({ status }) => status !== 'removed')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug))
        .concat(
          evmTokens
            .filter(({ status }) => status !== 'removed')
            .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug))
        ),
    [tezTokens, evmTokens]
  );

  const otherChainSlugsSorted = useMemoWithCompare(
    () => tokensChainsSlugs.sort(tokensSortPredicate),
    [tokensChainsSlugs, tokensSortPredicate]
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
}

const TabContentBase = memo<TabContentBaseProps>(
  ({ allSlugsSorted, allSlugsSortedGrouped, groupByNetwork, manageActive }) => {
    const {
      displayedSlugs,
      displayedGroupedSlugs,
      isSyncing,
      loadNextPlain,
      loadNextGrouped,
      searchValue,
      isInSearchMode,
      setSearchValue
    } = useAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

    const tezosChains = useAllTezosChains();
    const evmChains = useAllEvmChains();

    return (
      <TabContentBaseBody
        isInSearchMode={isInSearchMode}
        isSyncing={isSyncing}
        searchValue={searchValue}
        displayedSlugs={displayedSlugs}
        loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
        onSearchValueChange={setSearchValue}
        groupedSlugs={displayedGroupedSlugs}
        tezosChains={tezosChains}
        evmChains={evmChains}
        manageActive={manageActive}
      />
    );
  }
);

interface TabContentBaseBodyProps
  extends Omit<
    TokensTabBaseProps,
    'tokensCount' | 'children' | 'network' | 'oneRemDivRef' | 'getElementIndex' | 'accountId'
  > {
  manageActive: boolean;
  groupedSlugs: ChainGroupedSlugs | null;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  displayedSlugs: string[];
}

const TabContentBaseBody = memo<TabContentBaseBodyProps>(
  ({ manageActive, groupedSlugs, tezosChains, evmChains, displayedSlugs, ...restProps }) => {
    const { accountTezAddress, accountEvmAddress, accountId } = useContext(MultiChainTokensTabContext);
    const promoRef = useRef<HTMLDivElement>(null);
    const firstHeaderRef = useRef<HTMLDivElement>(null);
    const firstListItemRef = useRef<TokenListItemElement>(null);

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

      if (groupedSlugs) {
        return {
          tokensView: getGroupedTokensViewWithPromo({
            groupedSlugs,
            evmChains,
            tezosChains,
            promoJsx,
            firstListItemRef,
            firstHeaderRef,
            buildTokensJsxArray: (slugs, firstListItemRef, indexShift) =>
              buildTokensJsxArray(
                slugs,
                tezosChains,
                evmChains,
                accountTezAddress,
                accountEvmAddress,
                manageActive,
                firstListItemRef,
                indexShift
              )
          }),
          getElementIndex: makeGroupedTokenElementIndexFunction(
            promoRef,
            firstListItemRef,
            firstHeaderRef,
            groupedSlugs
          )
        };
      }

      const tokensJsx = buildTokensJsxArray(
        displayedSlugs,
        tezosChains,
        evmChains,
        accountTezAddress,
        accountEvmAddress,
        manageActive,
        firstListItemRef
      );

      if (manageActive) {
        return {
          tokensView: tokensJsx,
          getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
        };
      }

      return {
        tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
        getElementIndex: makeGetTokenElementIndexFunction(promoRef, firstListItemRef, tokensJsx.length)
      };
    }, [groupedSlugs, displayedSlugs, evmChains, tezosChains, manageActive, accountEvmAddress, accountTezAddress]);

    return (
      <TokensTabBase
        accountId={accountId}
        tokensCount={displayedSlugs.length}
        getElementIndex={getElementIndex}
        {...restProps}
      >
        {tokensView}
      </TokensTabBase>
    );
  }
);

function buildTokensJsxArray(
  chainSlugs: string[],
  tezosChains: StringRecord<TezosChain>,
  evmChains: StringRecord<EvmChain>,
  accountTezAddress: string,
  accountEvmAddress: HexString,
  manageActive: boolean,
  firstListItemRef: React.RefObject<TokenListItemElement> | null,
  indexShift = 0
) {
  return chainSlugs.map((chainSlug, i) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    if (chainKind === TempleChainKind.Tezos) {
      return (
        <TezosTokenListItem
          network={tezosChains[chainId]!}
          index={i + indexShift}
          key={chainSlug}
          publicKeyHash={accountTezAddress}
          assetSlug={assetSlug}
          manageActive={manageActive}
          ref={i === 0 ? firstListItemRef : null}
        />
      );
    }

    return (
      <EvmTokenListItem
        key={chainSlug}
        network={evmChains[chainId]!}
        index={i + indexShift}
        assetSlug={assetSlug}
        publicKeyHash={accountEvmAddress}
        manageActive={manageActive}
        ref={i === 0 ? firstListItemRef : null}
      />
    );
  });
}
