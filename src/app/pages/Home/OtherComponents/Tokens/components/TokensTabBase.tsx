import React, { FC } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { PageLoader } from 'app/atoms/Loader';
import { ManageAssetsViewStateButtons } from 'app/atoms/ManageAssetsViewStateButtons';
import {
  VisibilityTrackingInfiniteScroll,
  VisibilityTrackingInfiniteScrollProps
} from 'app/atoms/visibility-tracking-infinite-scroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { DAppConnection } from 'app/templates/DAppConnection';
import { SearchBarField } from 'app/templates/SearchField';
import { OneOfChains } from 'temple/front';

import { EmptySection } from './EmptySection';

export interface TokensTabBaseProps {
  tokensCount: number;
  searchValue: string;
  getElementIndex: VisibilityTrackingInfiniteScrollProps['getElementIndex'];
  loadNextPage: EmptyFn;
  onSearchValueChange: (value: string) => void;
  isSyncing: boolean;
  isInSearchMode: boolean;
  network?: OneOfChains;
}

export const TokensTabBase: FC<PropsWithChildren<TokensTabBaseProps>> = ({
  tokensCount,
  searchValue,
  getElementIndex,
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
      <StickyBar>
        <SearchBarField
          value={searchValue}
          disabled={filtersOpened}
          onValueChange={onSearchValueChange}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <ManageAssetsViewStateButtons />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions />
      ) : (
        <FadeTransition>
          <ContentContainer padding={tokensCount > 0}>
            {/*TODO: Update banner UI*/}
            {/*{manageActive ? null : <UpdateAppBanner stickyBarRef={stickyBarRef} />}*/}

            {tokensCount === 0 ? (
              isSyncing && !isInSearchMode ? (
                <PageLoader stretch />
              ) : (
                <EmptySection
                  forCollectibles={false}
                  manageActive={manageActive}
                  forSearch={isInSearchMode}
                  network={network}
                />
              )
            ) : (
              <>
                {manageActive && (
                  <AddCustomTokenButton
                    forCollectibles={false}
                    manageActive={manageActive}
                    network={network}
                    className="mb-4"
                  />
                )}
                <VisibilityTrackingInfiniteScroll getElementIndex={getElementIndex} loadNext={loadNextPage}>
                  {children}
                </VisibilityTrackingInfiniteScroll>
                {isSyncing && <SyncSpinner className="mt-4" />}
              </>
            )}
          </ContentContainer>
        </FadeTransition>
      )}

      <DAppConnection />
    </>
  );
};
