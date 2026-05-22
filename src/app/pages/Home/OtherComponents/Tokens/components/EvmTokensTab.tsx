import { Activity, FC, createContext, useContext, useMemo, useRef } from 'react';

import {
  useEvmAccountTokensForListing,
  useEvmAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  TokenListItemElement,
  getGroupedTokenElementIndex,
  getTokenElementIndex,
  useTokenWillBeRendered
} from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useRenderPromo } from '../utils';

import { TokensTabBase } from './tokens-tab-base';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from './tokens-views';

interface Props {
  publicKeyHash: HexString;
  accountId: string;
}

const EvmTokensTabContext = createContext<Props>({
  publicKeyHash: '0x',
  accountId: ''
});

export const EvmTokensTab: FC<Props> = props => {
  const { manageActive } = useTokensManageState();

  return (
    <EvmTokensTabContext value={props}>
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
      allSlugsSorted={allSlugsSorted}
      allSlugsSortedGrouped={allSlugsSortedGrouped}
      groupByNetwork={groupByNetwork}
      manageActive={true}
    />
  );
};

interface TabContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.EVM> | null;
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
  const { publicKeyHash, accountId } = useContext(EvmTokensTabContext);
  const { displayedSlugs, displayedGroupedSlugs, isSyncing, loadNextPlain, loadNextGrouped, isInSearchMode } =
    useEvmAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);

  const mainnetChain = useEthereumMainnetChain();
  const evmChains = useAllEvmChains();

  const tokenWillBeRendered = useTokenWillBeRendered();

  const TokenListItem: TokenListItemFC = ({ slug: chainSlug, ref, index }) => {
    const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

    return (
      <EvmTokenListItem
        showTags
        network={evmChains[chainId]!}
        index={index}
        assetSlug={assetSlug}
        publicKeyHash={publicKeyHash}
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
          evmChains={evmChains}
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
