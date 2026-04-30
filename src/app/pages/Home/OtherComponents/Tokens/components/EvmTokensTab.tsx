import { Activity, FC, createContext, useContext, useMemo, useRef, Ref } from 'react';

import { range } from 'lodash';

import {
  useEvmAccountTokensForListing,
  useEvmAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { useEvmAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useEvmAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { getGroupedTokensViewWithPromo, getTokensViewWithPromo } from '../utils';

import { TokensTabBase, TokensTabBaseProps } from './tokens-tab-base';

interface Props {
  publicKeyHash: HexString;
  accountId: string;
}

const EvmTokensTabContext = createContext<
  Props & Pick<TokensTabBaseProps, 'collectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'>
>({
  publicKeyHash: '0x',
  accountId: '',
  collectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});

export const EvmTokensTab: FC<Props> = ({ publicKeyHash, accountId }) => {
  const { manageActive } = useTokensManageState();
  const collectibles = useEvmAccountCollectibles(publicKeyHash);
  const balancesLoading = useEvmBalancesAreLoading();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesReady = collectibles.length > 0 || (!balancesLoading && !collectiblesMetadataLoading);
  const collectiblesSortPredicate = useEvmAccountCollectiblesSortPredicate(publicKeyHash);
  const contextValue = useMemo(
    () => ({ publicKeyHash, accountId, collectibles, collectiblesReady, collectiblesSortPredicate }),
    [publicKeyHash, accountId, collectibles, collectiblesReady, collectiblesSortPredicate]
  );

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
  const { publicKeyHash, accountId, ...tokensTabBaseProps } = useContext(EvmTokensTabContext);
  const { displayedSlugs, displayedGroupedSlugs, isSyncing, loadNextPlain, loadNextGrouped, isInSearchMode } =
    useEvmAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  const mainnetChain = useEthereumMainnetChain();
  const evmChains = useAllEvmChains();

  const { tokensView, getElementIndex } = useMemo(() => {
    const promoJsx =
      manageActive || !PartnersPromotionModule || !AdsConstantsModule ? null : (
        <PartnersPromotionModule.PartnersPromotion
          id="promo-token-item"
          key="promo-token-item"
          variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
          pageName={AdsConstantsModule.HOME_PAGE_NAME}
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
        getElementIndex:  () =>
          range(
            0,
            displayedGroupedSlugs.reduce((acc, [_, slugs]) => acc + slugs.length, 0)
          )
      };
    }

    const tokensJsx = buildTokensJsxArray(displayedSlugs, firstListItemRef);

    return {
      tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
      getElementIndex: () => range(0, tokensJsx.length)
    };

    function buildTokensJsxArray(chainSlugs: string[], firstListItemRef: Ref<TokenListItemElement>, indexShift = 0) {
      return chainSlugs.map((chainSlug, i) => {
        const [_, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

        return (
          <EvmTokenListItem
            showTags
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
  }, [
    displayedGroupedSlugs,
    displayedSlugs,
    manageActive,
    evmChains,
    publicKeyHash,
    PartnersPromotionModule,
    AdsConstantsModule
  ]);

  return (
    <TokensTabBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
      isSyncingTokens={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensTabBaseProps}
    >
      {tokensView}
    </TokensTabBase>
  );
};
