import { FC, useContext, useRef } from 'react';

import { useTezosAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement, useGroupableGetTokenElementIndex, useRenderPromo } from 'lib/ui/tokens-list';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensPageBase } from '../tokens-page-base';

import { TezosTokensPageContext } from './context';

interface PageContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.Tezos> | null;
  groupByNetwork: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

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
  const TokenListItem: TokenListItemFC = ({ slug: chainSlug, ref, index }) => {
    const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

    return (
      <TezosTokenListItem
        network={tezosChains[chainId]}
        index={index}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        manageActive={manageActive}
        ref={ref}
      />
    );
  };

  const getElementIndex = useGroupableGetTokenElementIndex(
    displayedGroupedSlugs,
    displayedSlugs,
    promoRef,
    firstListItemRef,
    firstHeaderRef
  );
  const Promo = useRenderPromo(manageActive, 'tokens', promoRef);

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
      {displayedGroupedSlugs ? (
        <GroupedTokensViewWithPromo
          groupedSlugs={displayedGroupedSlugs}
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
    </TokensPageBase>
  );
};
