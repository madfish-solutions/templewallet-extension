import React, { memo, useMemo } from 'react';

import { useEvmChainCollectiblesListingLogic } from 'app/hooks/collectibles-listing-logic/use-evm-chain-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';

import { EvmCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';

interface EvmChainCollectiblesTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainCollectiblesTab = memo<EvmChainCollectiblesTabProps>(({ chainId, publicKeyHash }) => {
  const { showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmChainCollectiblesListingLogic(
    publicKeyHash,
    chainId,
    manageActive
  );

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
        {paginatedSlugs.map(slug => (
          <EvmCollectibleItem
            key={slug}
            assetSlug={slug}
            evmChainId={chainId}
            accountPkh={publicKeyHash}
            showDetails={showInfo}
            manageActive={manageActive}
          />
        ))}
      </div>
    ),
    [chainId, manageActive, paginatedSlugs, publicKeyHash, showInfo]
  );

  return (
    <CollectiblesTabBase
      contentElement={contentElement}
      collectiblesCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
    />
  );
});
