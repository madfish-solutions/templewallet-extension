import { FC, ReactNode, Ref, useMemo, useRef } from 'react';

import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { useCollectiblesManageState } from 'app/hooks/use-assets-view-state';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { CollectiblesListItemElement, makeGetCollectiblesElementsIndexesFunction } from 'lib/ui/collectibles-list';

import { ListView } from './list-view';

interface NftsListViewProps {
  isSyncing: boolean;
  isInSearchMode: boolean;
  noCollectiblesAtAll: boolean;
  chainSlugs: string[];
  loadNextPage: EmptyFn;
  renderItem: (chainSlug: string, index: number, ref?: Ref<CollectiblesListItemElement>) => ReactNode;
  openCustomTokenModal: EmptyFn;
}

// React Compiler cannot handle this file because of some refs used during rendering
export const NftsListView: FC<NftsListViewProps> = ({
  isSyncing,
  isInSearchMode,
  noCollectiblesAtAll,
  chainSlugs,
  loadNextPage,
  renderItem,
  openCustomTokenModal
}) => {
  const { manageActive } = useCollectiblesManageState();
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
      noCollectiblesAtAll={noCollectiblesAtAll}
      isEmpty={chainSlugs.length === 0}
      isSyncing={isSyncing}
      isInSearchMode={isInSearchMode}
      openCustomTokenModal={openCustomTokenModal}
    >
      {isInSearchMode ? (
        <VisibilityTrackingInfiniteScroll loadNext={loadNextPage} getElementsIndexes={getElementsIndexes}>
          {contentElement}
        </VisibilityTrackingInfiniteScroll>
      ) : (
        <>
          {manageActive && (
            <AddCustomTokenButton manageActive={manageActive} onClick={openCustomTokenModal} className="mb-4" />
          )}
          <VisibilityTrackingInfiniteScroll loadNext={loadNextPage} getElementsIndexes={getElementsIndexes}>
            {contentElement}
          </VisibilityTrackingInfiniteScroll>
        </>
      )}
    </ListView>
  );
};
