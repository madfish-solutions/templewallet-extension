import { Activity, createContext, FC, useContext, useRef } from 'react';

import {
  useAccountTokensForListing,
  useAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import {
  getGroupedTokenElementIndex,
  getTokenElementIndex,
  TokenListItemElement,
  useTokenWillBeRendered
} from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { EvmChain, TezosChain, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { toNotRemovedChainTokensSlugs, useRenderPromo } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from './tokens-views';

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

export const MultiChainTokensTab: FC<Props> = props => {
  const { manageActive } = useTokensManageState();

  return (
    <MultiChainTokensTabContext value={props}>
      <Activity mode={manageActive ? 'hidden' : 'visible'} name="multichain-tokens-tab-default">
        <TabContent />
      </Activity>

      <Activity mode={manageActive ? 'visible' : 'hidden'} name="multichain-tokens-tab-manage">
        <TabContentWithManageActive />
      </Activity>
    </MultiChainTokensTabContext>
  );
};

const TabContent: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped, shouldShowHiddenTokensHint } =
    useAccountTokensForListing(accountTezAddress, accountEvmAddress, hideSmallBalance, groupByNetwork);

  return (
    <TabContentBase
      manageActive={false}
      groupByNetwork={groupByNetwork}
      allSlugsSorted={enabledChainsSlugsSorted}
      allSlugsSortedGrouped={enabledChainsSlugsSortedGrouped}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
    />
  );
};

const TabContentWithManageActive: FC = () => {
  const { accountTezAddress, accountEvmAddress } = useContext(MultiChainTokensTabContext);
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, enabledChainsSlugsSortedGrouped, tezTokens, evmTokens, tokensSortPredicate } =
    useAccountTokensForListing(accountTezAddress, accountEvmAddress, hideSmallBalance, groupByNetwork);

  const tokensChainsSlugs = toNotRemovedChainTokensSlugs(tezTokens, TempleChainKind.Tezos).concat(
    toNotRemovedChainTokensSlugs(evmTokens, TempleChainKind.EVM)
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
  shouldShowHiddenTokensHint?: boolean;
}

const TabContentBase: FC<TabContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  groupByNetwork,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const { displayedSlugs, displayedGroupedSlugs, isSyncing, loadNextPlain, loadNextGrouped, isInSearchMode } =
    useAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  return (
    <TabContentBaseBody
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

interface TabContentBaseBodyProps extends Omit<
  TokensTabBaseProps,
  'tokensCount' | 'children' | 'network' | 'oneRemDivRef' | 'getElementIndex' | 'accountId'
> {
  manageActive: boolean;
  groupedSlugs: ChainGroupedSlugs | null;
  tezosChains: StringRecord<TezosChain>;
  evmChains: StringRecord<EvmChain>;
  displayedSlugs: string[];
}

const TabContentBaseBody: FC<TabContentBaseBodyProps> = ({
  manageActive,
  groupedSlugs,
  tezosChains,
  evmChains,
  displayedSlugs,
  ...restProps
}) => {
  const { accountTezAddress, accountEvmAddress, accountId } = useContext(MultiChainTokensTabContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tokenWillBeRendered = useTokenWillBeRendered();

  const TokenListItem: TokenListItemFC = ({ slug: chainSlug, ref, index }) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    const commonProps = { index, ref, assetSlug, manageActive };

    if (chainKind === TempleChainKind.Tezos) {
      return (
        <TezosTokenListItem
          network={tezosChains[chainId]!}
          publicKeyHash={accountTezAddress}
          scam={mainnetTokensScamSlugsRecord[assetSlug]}
          {...commonProps}
        />
      );
    }

    return (
      <EvmTokenListItem showTags network={evmChains[chainId]!} publicKeyHash={accountEvmAddress} {...commonProps} />
    );
  };

  const getElementIndex = (y: number) =>
    groupedSlugs
      ? getGroupedTokenElementIndex(
          promoRef.current,
          firstListItemRef.current,
          firstHeaderRef.current,
          groupedSlugs,
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
      manageActive={manageActive}
      {...restProps}
    >
      {groupedSlugs ? (
        <GroupedTokensViewWithPromo
          groupedSlugs={groupedSlugs}
          evmChains={evmChains}
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
