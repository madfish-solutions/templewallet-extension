import { FC, useContext, useMemo, useRef, Ref } from 'react';

import { range } from 'lodash';

import { useEvmAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { getGroupedTokensViewWithPromo, getTokensViewWithPromo } from '../../utils';
import { TokensTabBase } from '../tokens-tab-base';

import { EvmTokensTabContext } from './context';

interface TabContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.EVM> | null;
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
