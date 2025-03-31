import React, { FC } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { AddCustomTokenButton } from 'app/atoms/AddCustomTokenButton';
import { ManageAssetsViewStateButtons } from 'app/atoms/ManageAssetsViewStateButtons';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { EmptySection } from 'app/pages/Home/OtherComponents/Tokens/components/EmptySection';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { OneOfChains } from 'temple/front';

interface CollectiblesTabBaseProps {
  collectiblesCount: number;
  searchValue: string;
  loadNextPage: EmptyFn;
  onSearchValueChange: (value: string) => void;
  isSyncing: boolean;
  isInSearchMode: boolean;
  network?: OneOfChains;
}

export const CollectiblesTabBase: FC<PropsWithChildren<CollectiblesTabBaseProps>> = ({
  collectiblesCount,
  searchValue,
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
          <ContentContainer padding={collectiblesCount > 0}>
            {collectiblesCount === 0 ? (
              <EmptySection
                forCollectibles={true}
                manageActive={manageActive}
                forSearch={isInSearchMode}
                network={network}
              />
            ) : (
              <>
                {isInSearchMode ? (
                  children
                ) : (
                  <>
                    {manageActive && (
                      <AddCustomTokenButton
                        forCollectibles={true}
                        manageActive={manageActive}
                        network={network}
                        className="mb-4"
                      />
                    )}
                    <SimpleInfiniteScroll loadNext={loadNextPage}>{children}</SimpleInfiniteScroll>
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
