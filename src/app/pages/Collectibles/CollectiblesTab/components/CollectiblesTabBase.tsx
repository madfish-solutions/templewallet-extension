import React, { FC } from 'react';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { ManageActiveTip } from 'app/atoms/ManageActiveTip';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useManageAssetsClickOutsideLogic } from 'app/hooks/use-manage-assets-click-outside-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { EmptySection } from 'app/pages/Home/OtherComponents/Tokens/components/EmptySection';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';

interface CollectiblesTabBaseProps {
  collectiblesCount: number;
  searchValue: string;
  loadNextPage: EmptyFn;
  onSearchValueChange: (value: string) => void;
  isSyncing: boolean;
  isInSearchMode?: boolean;
}

export const CollectiblesTabBase: FC<PropsWithChildren<CollectiblesTabBaseProps>> = ({
  collectiblesCount,
  searchValue,
  loadNextPage,
  onSearchValueChange,
  isSyncing,
  isInSearchMode = false,
  children
}) => {
  const { manageActive, toggleManageActive, filtersOpened, setFiltersClosed, toggleFiltersOpened } =
    useAssetsViewState();

  const { stickyBarRef, filterButtonRef, manageButtonRef, searchInputContainerRef, containerRef } =
    useManageAssetsClickOutsideLogic();

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          ref={searchInputContainerRef}
          value={searchValue}
          onValueChange={onSearchValueChange}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton ref={manageButtonRef} Icon={ManageIcon} active={manageActive} onClick={toggleManageActive} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer ref={containerRef} padding={collectiblesCount > 0}>
          {collectiblesCount === 0 ? (
            <EmptySection />
          ) : (
            <>
              {isInSearchMode ? (
                children
              ) : (
                <>
                  {manageActive && <ManageActiveTip />}
                  <SimpleInfiniteScroll loadNext={loadNextPage}>{children}</SimpleInfiniteScroll>
                </>
              )}

              <ScrollBackUpButton />

              {isSyncing && <SyncSpinner className="mt-6" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
};
