import { FC, Ref, useContext, useMemo, useRef } from 'react';

import { useTezosAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { parseChainAssetSlug } from 'lib/assets/utils';
import {
  getGroupedTokensViewWithPromo,
  getTokensViewWithPromo,
  makeGetTokenElementIndexFunction,
  makeGroupedTokenElementIndexFunction,
  TokenListItemElement
} from 'lib/ui/tokens-list';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { Promo } from '../promo';
import { TokensPageBase } from '../tokens-page-base';

import { TezosTokensPageContext } from './context';

interface PageContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.Tezos> | null;
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
  const { publicKeyHash, accountId, ...tokensPageBaseProps } = useContext(TezosTokensPageContext);
  const promoRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLDivElement>(null);
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const {
    applicableNetworks,
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
    const promoJsx = manageActive ? null : <Promo ref={promoRef} />;

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
  }, [displayedGroupedSlugs, displayedSlugs, tezosChains, publicKeyHash, mainnetTokensScamSlugsRecord, manageActive]);

  return (
    <TokensPageBase
      applicableNetworks={applicableNetworks}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      getElementIndex={getElementIndex}
      loadNextPage={groupByNetwork ? loadNextGrouped : loadNextPlain}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      manageActive={manageActive}
      {...tokensPageBaseProps}
    >
      {tokensView}
    </TokensPageBase>
  );
};
