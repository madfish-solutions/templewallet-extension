import React, { FC } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { ManageActiveTip } from 'app/atoms/ManageActiveTip';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useManageAssetsClickOutsideLogic } from 'app/hooks/use-manage-assets-click-outside-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { DAppConnection } from 'app/templates/DAppConnection';
import { SearchBarField } from 'app/templates/SearchField';
import { OneOfChains } from 'temple/front';

import { EmptySection } from './EmptySection';

interface TokensTabBaseProps {
  tokensCount: number;
  searchValue: string;
  loadNextPage: EmptyFn;
  onSearchValueChange: (value: string) => void;
  isSyncing: boolean;
  network?: OneOfChains;
}

export const TokensTabBase: FC<PropsWithChildren<TokensTabBaseProps>> = ({
  tokensCount,
  searchValue,
  loadNextPage,
  onSearchValueChange,
  isSyncing,
  network,
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
        <FadeTransition>
          <ContentContainer ref={containerRef} padding={tokensCount > 0}>
            {/*TODO: Update banner UI*/}
            {/*{manageActive ? null : <UpdateAppBanner stickyBarRef={stickyBarRef} />}*/}

            {tokensCount === 0 ? (
              <EmptySection forCollectibles={false} textI18n="tokensNotFound" network={network} />
            ) : (
              <>
                {manageActive && <ManageActiveTip />}
                <SimpleInfiniteScroll loadNext={loadNextPage}>{children}</SimpleInfiniteScroll>
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
