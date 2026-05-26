import { FC } from 'react';

import { useTezosAccountTokensListingLogic } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useRenderPromo } from 'lib/ui/tokens-list';
import { useAllTezosChains, useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ContentBodyBase, ContentBodyBaseProps } from '../content-body-base';

import { ContentBodyWithTezTokensProps } from './types';

interface ContentBaseProps
  extends
    ContentBodyWithTezTokensProps,
    Pick<ContentBodyBaseProps, 'tezosCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'> {
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

export const ContentBase: FC<ContentBaseProps> = ({
  allSlugsSorted,
  shouldShowHiddenTokensHint,
  publicKeyHash,
  accountId,
  ...contentBodyBaseProps
}) => {
  const {
    displayedSlugs: fullPageDisplayedSlugs,
    isSyncing,
    isInSearchMode
  } = useTezosAccountTokensListingLogic(allSlugsSorted, null);
  const displayedSlugs = fullPageDisplayedSlugs.slice(0, 3);

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
        ref={ref}
      />
    );
  };

  const Promo = useRenderPromo(false, 'home');

  return (
    <ContentBodyBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      isSyncingTokens={isSyncing}
      isInSearchMode={isInSearchMode}
      network={mainnetChain}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      {...contentBodyBaseProps}
    >
      <TokensViewWithPromo displayedSlugs={displayedSlugs} Promo={Promo} TokenListItem={TokenListItem} />
    </ContentBodyBase>
  );
};
