import { FC } from 'react';

import { useTezosAccountTokensForListing } from 'app/hooks/listing-logic/use-tezos-account-tokens-listing-logic';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { toTezEnabledCollectiblesChainSlugs, useTezosAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';

import { ContentBase } from './content-base';
import { ContentBodyWithTezTokensProps } from './types';

export const ContentBodyWithTezTokens: FC<ContentBodyWithTezTokensProps> = ({ publicKeyHash, accountId }) => {
  const tezosCollectibles = useTezosAccountCollectibles(publicKeyHash);
  const assetsLoading = useAreAssetsLoading('collectibles');
  const collectiblesReady = tezosCollectibles.length > 0 || !assetsLoading;
  const collectiblesSortPredicate = useTezosAccountCollectiblesSortPredicate(publicKeyHash);
  const { hideSmallBalance } = useTokensListOptionsSelector();
  const { enabledChainSlugsSorted, shouldShowHiddenTokensHint } = useTezosAccountTokensForListing(
    publicKeyHash,
    hideSmallBalance,
    false
  );

  const tezEnabledCollectiblesChainsSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);

  return (
    <ContentBase
      allSlugsSorted={enabledChainSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      publicKeyHash={publicKeyHash}
      accountId={accountId}
      tezosCollectibles={tezosCollectibles}
      collectiblesReady={collectiblesReady}
      collectiblesSortPredicate={collectiblesSortPredicate}
    />
  );
};
