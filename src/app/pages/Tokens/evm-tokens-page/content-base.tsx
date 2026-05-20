import { FC, useContext, useMemo, useRef, Ref, useCallback } from 'react';

import { useEvmAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { parseChainAssetSlug } from 'lib/assets/utils';
import {
  getGroupedTokensViewWithPromo,
  getTokensViewWithPromo,
  makeGetTokenElementIndexFunction,
  makeGroupedTokenElementIndexFunction,
  TokenListItemElement
} from 'lib/ui/tokens-list';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { Promo } from '../promo';
import { TokensPageBase } from '../tokens-page-base';

import { EvmTokensPageContext } from './context';

interface PageContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.EVM> | null;
  groupByNetwork: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

// React Compiler cannot handle this file because of some refs used during rendering
export const PageContentBase: FC<PageContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  groupByNetwork,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const { publicKeyHash, accountId, ...tokensPageBaseProps } = useContext(EvmTokensPageContext);
  const {
    applicableNetworks,
    displayedSlugs,
    displayedGroupedSlugs,
    isSyncing,
    loadNextPlain,
    loadNextGrouped,
    isInSearchMode
  } = useEvmAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);

  const mainnetChain = useEthereumMainnetChain();
  const evmChains = useAllEvmChains();

  const buildTokensJsxArray = useCallback(
    (chainSlugs: string[], firstListItemRef: Ref<TokenListItemElement>, indexShift = 0) =>
      chainSlugs.map((chainSlug, i) => {
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
      }),
    [evmChains, publicKeyHash, manageActive]
  );

  const { tokensView, getElementIndex } = useMemo(() => {
    const promoJsx = manageActive ? null : <Promo ref={promoRef} />;

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
  }, [
    displayedGroupedSlugs,
    displayedSlugs,
    buildTokensJsxArray,
    promoRef,
    firstListItemRef,
    firstHeaderRef,
    evmChains,
    manageActive
  ]);

  return (
    <TokensPageBase
      applicableNetworks={applicableNetworks}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensPageBaseProps}
    >
      {tokensView}
    </TokensPageBase>
  );
};
