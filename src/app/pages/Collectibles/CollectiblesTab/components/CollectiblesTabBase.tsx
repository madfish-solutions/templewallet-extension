import React, { FC } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { AssetsBar } from 'app/atoms/AssetsBar';
import { PageLoader } from 'app/atoms/Loader';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ContentContainer } from 'app/layouts/containers';
import { EmptySection } from 'app/pages/Home/OtherComponents/Tokens/components/EmptySection';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { OneOfChains } from 'temple/front';

export interface CollectiblesTabBaseProps {
  collectiblesCount: number;
  searchValue: string;
  getElementsIndexes: VisibilityTrackingInfiniteScrollProps['getElementsIndexes'];
  loadNextPage: EmptyFn;
  onSearchValueChange: SyncFn<string>;
  isSyncing: boolean;
  isInSearchMode: boolean;
  network?: OneOfChains;
}

export const CollectiblesTabBase: FC<PropsWithChildren<CollectiblesTabBaseProps>> = ({
  collectiblesCount,
  searchValue,
  getElementsIndexes,
  loadNextPage,
  onSearchValueChange,
  isSyncing,
  isInSearchMode,
  network,
  children
}) => {
  const { manageActive, filtersOpened } = useAssetsViewState();

  return (
    <>
      <AssetsBar
        tabSlug="collectibles"
        searchValue={searchValue}
        onSearchValueChange={onSearchValueChange}
      />

      {filtersOpened ? (
        <AssetsFilterOptions />
      ) : (
        <FadeTransition>
          <ContentContainer withShadow={false} padding={collectiblesCount > 0}>
            {collectiblesCount === 0 ? (
              isSyncing && !isInSearchMode ? (
                <PageLoader stretch />
              ) : (
                <EmptySection
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

                <ScrollBackUpButton />
              </>
            )}
          </ContentContainer>
        </FadeTransition>
      )}
    </>
  );
};
