import { FC, ReactNode, Ref, useMemo, useRef } from 'react';

import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { useManageState } from 'app/hooks/use-collectibles-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { CollectiblesListItemElement, makeGetCollectiblesElementsIndexesFunction } from 'lib/ui/collectibles-list';
import { OneOfChains } from 'temple/front';

import { ListView } from './list-view';

export interface NftsListViewProps {
  collectiblesCount: number;
  isSyncing: boolean;
  isInSearchMode: boolean;
  network?: OneOfChains;
  chainSlugs: string[];
  loadNextPage: EmptyFn;
  renderItem: (chainSlug: string, index: number, ref?: Ref<CollectiblesListItemElement>) => ReactNode;
}

export const NftsListView: FC<NftsListViewProps> = ({
  collectiblesCount,
  isSyncing,
  isInSearchMode,
  network,
  chainSlugs,
  loadNextPage,
  renderItem
}) => {
  const { manageActive } = useManageState();
  const { showInfo } = useCollectiblesListOptionsSelector();
  const firstItemRef = useRef<CollectiblesListItemElement>(null);

  const contentElement = useMemo(
    () => (
      <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
        {chainSlugs.map((chainSlug, index) => renderItem(chainSlug, index, index === 0 ? firstItemRef : undefined))}
      </div>
    ),
    [manageActive, chainSlugs, renderItem]
  );
  const getElementsIndexes = useMemo(
    () => makeGetCollectiblesElementsIndexesFunction(firstItemRef, chainSlugs.length, showInfo, manageActive),
    [chainSlugs.length, manageActive, showInfo]
  );

  return (
    <ListView
      isEmpty={collectiblesCount === 0}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      manageActive={manageActive}
      network={network}
    >
      {isInSearchMode ? (
        <VisibilityTrackingInfiniteScroll loadNext={loadNextPage} getElementsIndexes={getElementsIndexes}>
          {contentElement}
        </VisibilityTrackingInfiniteScroll>
      ) : (
        <>
          {manageActive && (
            <AddCustomTokenButton forCollectibles manageActive={manageActive} network={network} className="mb-4" />
          )}
          <VisibilityTrackingInfiniteScroll loadNext={loadNextPage} getElementsIndexes={getElementsIndexes}>
            {contentElement}
          </VisibilityTrackingInfiniteScroll>
        </>
      )}
    </ListView>
  );
};
