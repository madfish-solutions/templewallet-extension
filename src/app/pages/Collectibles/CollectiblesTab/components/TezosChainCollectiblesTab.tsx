import React, { memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useTezosChainCollectiblesListingLogic } from 'app/hooks/collectibles-listing-logic/use-tezos-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTezosChainByChainId } from 'temple/front';

import { TezosCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';

interface TezosChainCollectiblesTabProps {
  chainId: string;
  publicKeyHash: string;
}

export const TezosChainCollectiblesTab = memo<TezosChainCollectiblesTabProps>(({ chainId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { blur, showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { isInSearchMode, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosChainCollectiblesListingLogic(publicKeyHash, network, manageActive);

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
        {paginatedSlugs.map(slug => (
          <TezosCollectibleItem
            key={slug}
            assetSlug={slug}
            accountPkh={publicKeyHash}
            tezosChainId={chainId}
            adultBlur={blur}
            areDetailsShown={showInfo}
            hideWithoutMeta={isInSearchMode}
            manageActive={manageActive}
          />
        ))}
      </div>
    ),
    [paginatedSlugs, publicKeyHash, chainId, blur, showInfo, isInSearchMode, manageActive]
  );

  return (
    <CollectiblesTabBase
      contentElement={contentElement}
      collectiblesCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
    />
  );
});
