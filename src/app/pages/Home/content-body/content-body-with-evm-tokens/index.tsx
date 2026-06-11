import { FC } from 'react';

import { useEvmAccountTokensForListing } from 'app/hooks/listing-logic/use-evm-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import { useEvmCollectiblesMetadataLoading } from 'app/hooks/use-evm-collectibles-meta-loading';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useEvmAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';

import { ContentBase } from './content-base';
import { ContentBodyWithEvmTokensProps } from './types';

export const ContentBodyWithEvmTokens: FC<ContentBodyWithEvmTokensProps> = ({ publicKeyHash, accountId }) => {
  const evmCollectibles = useEvmAccountCollectibles(publicKeyHash);
  const balancesLoading = useEvmBalancesAreLoading();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesReady = evmCollectibles.length > 0 || (!balancesLoading && !collectiblesMetadataLoading);
  const collectiblesSortPredicate = useEvmAccountCollectiblesSortPredicate(publicKeyHash);
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainSlugsSorted: fullPageEnabledChainSlugsSorted, shouldShowHiddenTokensHint } =
    useEvmAccountTokensForListing(publicKeyHash, hideSmallBalance, false);
  const enabledChainSlugsSorted = fullPageEnabledChainSlugsSorted.slice(0, 3);

  useEvmCollectiblesMetadataLoading(publicKeyHash);

  return (
    <ContentBase
      allSlugsSorted={enabledChainSlugsSorted}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      publicKeyHash={publicKeyHash}
      accountId={accountId}
      collectiblesReady={collectiblesReady}
      collectiblesSortPredicate={collectiblesSortPredicate}
      evmCollectibles={evmCollectibles}
    />
  );
};
