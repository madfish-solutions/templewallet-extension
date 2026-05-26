import { FC } from 'react';

import {
  useAccountTokensForListing,
  useAccountTokensListingLogic
} from 'app/hooks/listing-logic/use-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from 'app/hooks/listing-logic/use-evm-balances-loading-state';
import { useEvmCollectiblesMetadataLoading } from 'app/hooks/use-evm-collectibles-meta-loading';
import {
  useGroupByNetworkBehaviorSelector,
  useTokensListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import {
  toTezEnabledCollectiblesChainSlugs,
  useEvmAccountCollectibles,
  useTezosAccountCollectibles
} from 'lib/assets/hooks/collectibles';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';

import { ContentBaseBody } from './content-base-body';
import { ContentBodyWithMultiChainTokensProps } from './types';

export const ContentBodyWithMultiChainTokens: FC<ContentBodyWithMultiChainTokensProps> = ({
  accountEvmAddress,
  accountTezAddress,
  accountId
}) => {
  const tezosCollectibles = useTezosAccountCollectibles(accountTezAddress);
  const evmCollectibles = useEvmAccountCollectibles(accountEvmAddress);
  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const evmBalancesLoading = useEvmBalancesAreLoading();
  const evmCollectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const collectiblesSortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);
  const collectiblesReady =
    (tezosCollectibles.length > 0 || !tezAssetsLoading) &&
    (evmCollectibles.length > 0 || (!evmBalancesLoading && !evmCollectiblesMetadataLoading));
  const groupByNetwork = useGroupByNetworkBehaviorSelector();
  const { hideSmallBalance } = useTokensListOptionsSelector();

  const { enabledChainsSlugsSorted, shouldShowHiddenTokensHint } = useAccountTokensForListing(
    accountTezAddress,
    accountEvmAddress,
    hideSmallBalance,
    groupByNetwork
  );
  const {
    displayedSlugs: fullPageDisplayedSlugs,
    isSyncing,
    isInSearchMode
  } = useAccountTokensListingLogic(enabledChainsSlugsSorted, null);
  const displayedSlugs = fullPageDisplayedSlugs.slice(0, 3);

  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  const tezEnabledCollectiblesChainsSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);
  useEvmCollectiblesMetadataLoading(accountEvmAddress);

  return (
    <ContentBaseBody
      isInSearchMode={isInSearchMode}
      isSyncingTokens={isSyncing}
      displayedSlugs={displayedSlugs}
      tezosChains={tezosChains}
      evmChains={evmChains}
      shouldShowHiddenTokensHint={shouldShowHiddenTokensHint}
      accountTezAddress={accountTezAddress}
      accountEvmAddress={accountEvmAddress}
      accountId={accountId}
      collectiblesReady={collectiblesReady}
      collectiblesSortPredicate={collectiblesSortPredicate}
      tezosCollectibles={tezosCollectibles}
      evmCollectibles={evmCollectibles}
    />
  );
};
