import { FC, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import {
  useTezosChainAccountTokensForListing,
  useTezosChainAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-tezos-chain-account-tokens-listing-logic';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { TezosTokenListItem } from 'app/templates/tokens/token-list-item';
import { TokenListItemFC, TokensViewWithPromo } from 'app/templates/tokens/tokens-views';
import { toTezEnabledCollectiblesChainSlugs, useTezosChainAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useRenderPromo } from 'lib/ui/tokens-list';
import { useTezosChainByChainId } from 'temple/front';

import { ContentBodyBase } from './content-body-base';

interface Props {
  chainId: string;
  publicKeyHash: string;
  accountId: string;
}

export const ContentBodyWithTezChainTokens: FC<Props> = ({ chainId, accountId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const tezosCollectibles = useTezosChainAccountCollectibles(publicKeyHash, chainId);
  const collectiblesLoading = useAreAssetsLoading('collectibles');
  const collectiblesReady = tezosCollectibles.length > 0 || !collectiblesLoading;
  const collectiblesSortPredicate = useTezosChainCollectiblesSortPredicate(publicKeyHash, chainId);
  const { enabledTokenSlugsSorted, shouldShowHiddenTokensHint } = useTezosChainAccountTokensForListing(
    publicKeyHash,
    network.chainId
  );

  const tezEnabledCollectiblesChainsSlugs = useMemo(
    () => toTezEnabledCollectiblesChainSlugs(tezosCollectibles),
    [tezosCollectibles]
  );
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  const { displayedSlugs: fullPageDisplayedSlugs, isSyncing } = useTezosChainAccountTokensListingLogic(
    enabledTokenSlugsSorted,
    network.chainId,
    true
  );
  const displayedSlugs = fullPageDisplayedSlugs.slice(0, 3);

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const TokenListItem: TokenListItemFC = ({ slug, ref, index }) => (
    <TezosTokenListItem
      showTags={false}
      network={network}
      index={index}
      publicKeyHash={publicKeyHash}
      assetSlug={slug}
      scam={mainnetTokensScamSlugsRecord[slug]}
      ref={ref}
    />
  );

  const Promo = useRenderPromo(false, 'home');

  return (
    <ContentBodyBase
      accountId={accountId}
      tokensCount={displayedSlugs.length}
      isSyncingTokens={isSyncing}
      network={network}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      tezosCollectibles={tezosCollectibles}
      collectiblesReady={collectiblesReady}
      collectiblesSortPredicate={collectiblesSortPredicate}
    >
      <TokensViewWithPromo displayedSlugs={displayedSlugs} Promo={Promo} TokenListItem={TokenListItem} />
    </ContentBodyBase>
  );
};
