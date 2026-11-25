import { FC, useContext } from 'react';

import { useTezosAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, VirtualTokensView } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useRenderPromo } from 'lib/ui/tokens-list';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TokensPageBase } from '../tokens-page-base';

import { TezosTokensPageContext } from './context';

interface PageContentBaseProps {
  allSlugsSorted: string[];
  allSlugsSortedGrouped: ChainGroupedSlugs<TempleChainKind.Tezos> | null;
  manageActive: boolean;
  shouldShowHiddenTokensHint?: boolean;
}

export const PageContentBase: FC<PageContentBaseProps> = ({
  allSlugsSorted,
  allSlugsSortedGrouped,
  manageActive,
  shouldShowHiddenTokensHint
}) => {
  const { publicKeyHash, accountId, ...tokensPageBaseProps } = useContext(TezosTokensPageContext);
  const { applicableNetworks, displayedSlugs, displayedGroupedSlugs, isSyncing, isInSearchMode } =
    useTezosAccountTokensListingLogic(allSlugsSorted, allSlugsSortedGrouped);

  const mainnetChain = useTezosMainnetChain();
  const tezosChains = useAllTezosChains();
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const TokenListItem: TokenListItemFC = ({ slug: chainSlug }) => {
    const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

    return (
      <TezosTokenListItem
        network={tezosChains[chainId]}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        manageActive={manageActive}
      />
    );
  };

  const Promo = useRenderPromo(manageActive, 'tokens');

  return (
    <TokensPageBase
      applicableNetworks={applicableNetworks}
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      manageActive={manageActive}
      {...tokensPageBaseProps}
    >
      <VirtualTokensView
        slugs={displayedSlugs}
        groupedSlugs={displayedGroupedSlugs}
        tezosChains={tezosChains}
        Promo={Promo}
        TokenListItem={TokenListItem}
      />
    </TokensPageBase>
  );
};
