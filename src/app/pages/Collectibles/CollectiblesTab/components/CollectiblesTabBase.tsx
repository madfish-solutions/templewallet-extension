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
import { AddTokenModal } from 'app/pages/Home/OtherComponents/Tokens/components/AddTokenModal';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { useBooleanState } from 'lib/ui/hooks';
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
  const [customTokenModalOpened, openCustomTokenModal, closeCustomTokenModal] = useBooleanState(false);

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
              onAddCustomTokenClick={openCustomTokenModal}
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
                  <AddCustomTokenButton manageActive={manageActive} onClick={openCustomTokenModal} className="mb-4" />
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

      <AddTokenModal
        forCollectible={true}
        opened={customTokenModalOpened}
        onRequestClose={closeCustomTokenModal}
        initialNetwork={network}
      />
    </FadeTransition>
  );
};
