import { FC } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import {
  useEvmChainAccountTokensForListing,
  useEvmChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-evm-chain-account-tokens-listing-logic';
import { useEvmCollectiblesMetadataLoading } from 'app/hooks/use-evm-collectibles-meta-loading';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { EvmTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { useEvmChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useEvmChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useRenderPromo } from 'lib/ui/tokens-list';
import { useEvmChainByChainId } from 'temple/front/chains';

import { ContentBodyBase } from './content-body-base';

interface Props {
  chainId: number;
  publicKeyHash: HexString;
  accountId: string;
}

export const ContentBodyWithEvmChainTokens: FC<Props> = ({ chainId, publicKeyHash, accountId }) => {
  const network = useEvmChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const evmCollectibles = useEvmChainAccountCollectibles(publicKeyHash, chainId);
  const collectiblesLoading = useEvmBalancesAreLoading();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesReady = evmCollectibles.length > 0 || (!collectiblesLoading && !collectiblesMetadataLoading);
  const collectiblesSortPredicate = useEvmChainCollectiblesSortPredicate(publicKeyHash, chainId);
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledSlugsSorted, shouldShowHiddenTokensHint } = useEvmChainAccountTokensForListing(
    publicKeyHash,
    network.chainId,
    hideSmallBalance
  );

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  const { displayedSlugs: fullPageDisplayedSlugs, isSyncing } = useEvmChainAccountTokensListingLogic(
    enabledSlugsSorted,
    network.chainId,
    true
  );
  const displayedSlugs = fullPageDisplayedSlugs.slice(0, 3);

  const TokenListItem: TokenListItemFC = ({ slug, ref, index }) => {
    return (
      <EvmTokenListItem
        showTags={false}
        network={network}
        index={index}
        assetSlug={slug}
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
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      evmCollectibles={evmCollectibles}
      collectiblesReady={collectiblesReady}
      collectiblesSortPredicate={collectiblesSortPredicate}
    >
      <TokensViewWithPromo displayedSlugs={displayedSlugs} Promo={Promo} TokenListItem={TokenListItem} />
    </ContentBodyBase>
  );
};
