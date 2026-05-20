import { FC, Ref, useContext, useMemo, useRef } from 'react';

import { range } from 'lodash';

import { useTezosAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { getGroupedTokensViewWithPromo, getTokensViewWithPromo, TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensTabBase } from '../tokens-tab-base';

import { TezosTokensTabContext } from './context';

interface TabContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.Tezos> | null;
  groupByNetwork: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

// React Compiler cannot handle this file because of some refs used during rendering
export const TabContentBase: FC<TabContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  groupByNetwork,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const { publicKeyHash, accountId, ...tokensTabBaseProps } = useContext(TezosTokensTabContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const { displayedSlugs, displayedGroupedSlugs, isSyncing, isInSearchMode, loadNextGrouped, loadNextPlain } =
    useTezosAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  const mainnetChain = useTezosMainnetChain();
  const tezosChains = useAllTezosChains();
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

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
          tezosChains,
          promoJsx,
          firstListItemRef,
          firstHeaderRef,
          buildTokensJsxArray
        }),
        getElementIndex: () =>
          range(
            0,
            displayedGroupedSlugs.reduce((acc, [_, slugs]) => acc + slugs.length, 0)
          )
      };
    }

    const tokensJsx = buildTokensJsxArray(displayedSlugs, firstListItemRef);

    return {
      tokensView: getTokensViewWithPromo(tokensJsx, promoJsx),
      getElementIndex: () => range(0, tokensJsx.length + 1)
    };

    function buildTokensJsxArray(chainSlugs: string[], firstListItemRef: Ref<TokenListItemElement>, indexShift = 0) {
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
  }, [
    displayedGroupedSlugs,
    displayedSlugs,
    tezosChains,
    publicKeyHash,
    mainnetTokensScamSlugsRecord,
    manageActive,
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
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      manageActive={manageActive}
      {...tokensTabBaseProps}
    >
      {tokensView}
    </TokensTabBase>
  );
};
