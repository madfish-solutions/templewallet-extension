import { Activity, createContext, FC, Ref, useContext, useMemo, useRef } from 'react';

import { range } from 'lodash';

import {
  useAccountTokensForListing,
  useAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import {
  usePreservedOrderSlugsGroupsToManage,
  usePreservedOrderSlugsToManage
} from 'app/hooks/listing-logic/use-manageable-slugs';
import { useTokensManageState } from 'app/hooks/use-assets-view-state';
import { useEvmCollectiblesMetadataLoading } from 'app/pages/Nfts/hooks/use-evm-collectibles-meta-loading';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { EvmTokenListItem, TezosTokenListItem } from 'app/templates/TokenListItem';
import { useAdsConstantsModule } from 'lib/ads-constants';
import {
  toTezEnabledCollectiblesChainSlugs,
  useEvmAccountCollectibles,
  useTezosAccountCollectibles
} from 'lib/assets/hooks/collectibles';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TokenListItemElement } from 'lib/ui/tokens-list';
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

const MultiChainTokensTabContext = createContext<
  Props &
    Pick<
      TokensTabBaseProps,
      'tezosCollectibles' | 'evmCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'
    >
>({
  accountTezAddress: '',
  accountEvmAddress: '0x',
  accountId: '',
  tezosCollectibles: [],
  evmCollectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});

export const MultiChainTokensTab: FC<Props> = ({ accountEvmAddress, accountTezAddress, accountId }) => {
  const { manageActive } = useTokensManageState();

  const tezosCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectibles = useEvmAccountCollectibles(accountEvmAddress);
  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmCollectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesSortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);
  const collectiblesReady =
    (tezosCollectibles.length > 0 || !tezAssetsLoading) &&
    (evmCollectibles.length > 0 || (!evmBalancesLoading && !evmCollectiblesMetadataLoading));
  const contextValue = useMemo(
    () => ({
      accountId,
      accountEvmAddress,
      accountTezAddress,
      tezosCollectibles,
      evmCollectibles,
      collectiblesReady,
      collectiblesSortPredicate
    }),
    [
      accountId,
      accountEvmAddress,
      accountTezAddress,
      tezosCollectibles,
      evmCollectibles,
      collectiblesReady,
      collectiblesSortPredicate
    ]
  );

  const tezEnabledCollectiblesChainsSlugs = useMemo(
    () => toTezEnabledCollectiblesChainSlugs(tezosCollectibles),
    [tezosCollectibles]
  );
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);
  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return (
    <MultiChainTokensTabContext value={contextValue}>
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
      isSyncingTokens={isSyncing}
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

interface TabContentBaseBodyProps extends Pick<
  TokensTabBaseProps,
  'loadNextPage' | 'isSyncingTokens' | 'isInSearchMode' | 'shouldShowHiddenTokensHint'
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
  const { accountTezAddress, accountEvmAddress, ...tokensTabBaseProps } = useContext(MultiChainTokensTabContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

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
              mainnetTokensScamSlugsRecord,
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
        getElementIndex: () =>
          range(
            0,
            groupedSlugs.reduce((acc, [_, slugs]) => acc + slugs.length, 0)
          )
      };
    }

    const tokensJsx = buildTokensJsxArray(
      mainnetTokensScamSlugsRecord,
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
        getElementIndex: () => range(0, tokensJsx.length)
      };
    }

    return {
      tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
      getElementIndex: () => range(0, tokensJsx.length + 1)
    };
  }, [
    groupedSlugs,
    displayedSlugs,
    evmChains,
    tezosChains,
    manageActive,
    accountEvmAddress,
    accountTezAddress,
    PartnersPromotionModule,
    AdsConstantsModule
  ]);

  return (
    <TokensTabBase
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      manageActive={manageActive}
      {...restProps}
      {...tokensTabBaseProps}
    >
      {tokensView}
    </TokensTabBase>
  );
};

function buildTokensJsxArray(
  scamSlugs: Record<string, boolean>,
  chainSlugs: string[],
  tezosChains: StringRecord<TezosChain>,
  evmChains: StringRecord<EvmChain>,
  accountTezAddress: string,
  accountEvmAddress: HexString,
  manageActive: boolean,
  firstListItemRef: Ref<TokenListItemElement>,
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
          scam={scamSlugs[assetSlug]}
          assetSlug={assetSlug}
          manageActive={manageActive}
          ref={i === 0 ? firstListItemRef : null}
        />
      );
    }

    return (
      <EvmTokenListItem
        showTags
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
