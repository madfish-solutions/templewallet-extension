import { FC, useContext, useRef } from 'react';

import { range } from 'lodash';

import { useEvmAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { EvmTokenListItem } from 'app/templates/TokenListItem';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TokenListItemElement } from 'lib/ui/tokens-list';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useRenderPromo } from '../../utils';
import { TokensTabBase } from '../tokens-tab-base';
import { GroupedTokensViewWithPromo, TokenListItemFC, TokensViewWithPromo } from '../tokens-views';

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

  const mainnetChain = useEthereumMainnetChain();
  const evmChains = useAllEvmChains();

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
      manageActive={manageActive}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...tokensTabBaseProps}
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
