import React, { FC } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { PageLoader } from 'app/atoms/Loader';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { ContentContainer } from 'app/layouts/containers';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { OneOfChains } from 'temple/front';

export interface CollectiblesTabBaseProps {
  collectiblesCount: number;
  getElementsIndexes: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  isSyncing: boolean;
  isInSearchMode: boolean;
  manageActive: boolean;
  network?: OneOfChains;
}

export const CollectiblesTabBase: FC<PropsWithChildren<CollectiblesTabBaseProps>> = ({
  collectiblesCount,
  getElementsIndexes,
  loadNextPage,
  isSyncing,
  isInSearchMode,
  manageActive,
  network,
  children
}) => {
  return (
    <FadeTransition>
      <ContentContainer withShadow={false} padding={collectiblesCount > 0}>
        {collectiblesCount === 0 ? (
          isSyncing && !isInSearchMode ? (
            <PageLoader stretch />
          ) : (
            <AssetsEmptySection
              forCollectibles
              manageActive={manageActive}
              forSearch={isInSearchMode}
              network={network}
            />
          )
        ) : (
          <>
            {isInSearchMode ? (
              <VisibilityTrackingInfiniteScroll loadNext={loadNextPage} getElementsIndexes={getElementsIndexes}>
                {children}
              </VisibilityTrackingInfiniteScroll>
            ) : (
              <>
                {manageActive && (
                  <AddCustomTokenButton
                    forCollectibles
                    manageActive={manageActive}
                    network={network}
                    className="mb-4"
                  />
                )}
                <VisibilityTrackingInfiniteScroll loadNext={loadNextPage} getElementsIndexes={getElementsIndexes}>
                  {children}
                </VisibilityTrackingInfiniteScroll>
              </>
            )}

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </ContentContainer>
    </FadeTransition>
  );
};
