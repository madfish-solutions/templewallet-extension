import React, { memo, useMemo } from 'react';

import { useTezosAccountCollectiblesListingLogic } from 'app/hooks/collectibles-listing-logic/use-tezos-account-collectibles-listing-logic';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { fromChainAssetSlug } from 'lib/assets/utils';

import { TezosCollectibleItem } from './CollectibleItem';
import { CollectiblesTabBase } from './CollectiblesTabBase';

interface TezosCollectiblesTabProps {
  publicKeyHash: string;
}

export const TezosCollectiblesTab = memo<TezosCollectiblesTabProps>(({ publicKeyHash }) => {
  const { blur, showInfo } = useCollectiblesListOptionsSelector();
  const { manageActive } = useManageAssetsState();

  const { isInSearchMode, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosAccountCollectiblesListingLogic(publicKeyHash, manageActive);

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
        {paginatedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);

          return (
            <TezosCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              accountPkh={publicKeyHash}
              tezosChainId={chainId}
              adultBlur={blur}
              areDetailsShown={showInfo}
              hideWithoutMeta={isInSearchMode}
              manageActive={manageActive}
            />
          );
        })}
      </div>
    ),
    [paginatedSlugs, publicKeyHash, blur, showInfo, isInSearchMode, manageActive]
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
