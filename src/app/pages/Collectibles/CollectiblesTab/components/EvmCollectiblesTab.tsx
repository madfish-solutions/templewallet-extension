import React, { memo, useMemo } from 'react';

import { useEvmAccountCollectiblesListingLogic } from 'app/hooks/listing-logic/use-evm-account-collectibles-listing-logic';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { fromChainAssetSlug } from 'lib/assets/utils';

import { EvmCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';

interface EvmCollectiblesTabProps {
  publicKeyHash: HexString;
}

export const EvmCollectiblesTab = memo<EvmCollectiblesTabProps>(({ publicKeyHash }) => {
  const { showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useAssetsViewState();

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmAccountCollectiblesListingLogic(
    publicKeyHash,
    manageActive
  );

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
        {paginatedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

          return (
            <EvmCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              evmChainId={chainId}
              accountPkh={publicKeyHash}
              showDetails={showInfo}
              manageActive={manageActive}
            />
          );
        })}
      </div>
    ),
    [manageActive, paginatedSlugs, publicKeyHash, showInfo]
  );

  return (
    <CollectiblesTabBase
      collectiblesCount={paginatedSlugs.length}
      searchValue={searchValue}
      loadNextPage={loadNext}
      onSearchValueChange={setSearchValue}
      isSyncing={isSyncing}
    >
      {contentElement}
    </CollectiblesTabBase>
  );
});
