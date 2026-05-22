import { FC, useContext, useRef } from 'react';

import { range } from 'lodash';

import { useTezosAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useRenderPromo } from '../../utils';
import { TokensTabBase } from '../tokens-tab-base';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from '../tokens-views';

import { TezosTokensTabContext } from './context';

interface TabContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.Tezos> | null;
  groupByNetwork: boolean;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

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

  const getElementIndex = () =>
    range(
      0,
      displayedGroupedSlugs
        ? displayedGroupedSlugs.reduce((acc, [_, slugs]) => acc + slugs.length, 0)
        : displayedSlugs.length + 1
    );

  const Promo = useRenderPromo(manageActive, promoRef);

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
    </TokensTabBase>
  );
};
