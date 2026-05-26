import { FC } from 'react';

import { useEvmAccountTokensListingLogic } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useRenderPromo } from 'lib/ui/tokens-list';
import { useAllEvmChains, useEthereumMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ContentBodyBase, ContentBodyBaseProps } from '../content-body-base';

import { ContentBodyWithEvmTokensProps } from './types';

interface ContentBaseProps
  extends
    ContentBodyWithEvmTokensProps,
    Pick<ContentBodyBaseProps, 'evmCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'> {
  allSlugsSorted: string[];
  shouldShowHiddenTokensHint?: boolean;
}

export const ContentBase: FC<ContentBaseProps> = ({
  allSlugsSorted,
  shouldShowHiddenTokensHint,
  publicKeyHash,
  accountId,
  ...tokensContentBaseProps
}) => {
  const {
    displayedSlugs: fullPageDisplayedSlugs,
    isSyncing,
    isInSearchMode
  } = useEvmAccountTokensListingLogic(allSlugsSorted, null);
  const displayedSlugs = fullPageDisplayedSlugs.slice(0, 3);

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
      {...tokensContentBaseProps}
    >
      <TokensViewWithPromo displayedSlugs={displayedSlugs} Promo={Promo} TokenListItem={TokenListItem} />
    </ContentBodyBase>
  );
};
