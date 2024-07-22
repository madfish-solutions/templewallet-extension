import React, { FC, useRef } from 'react';

import useOnClickOutside from 'use-onclickoutside';

import { IconBase, SyncSpinner } from 'app/atoms';
import { useAssetsSegmentControlRef } from 'app/atoms/AssetsSegmentControl';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options-state';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { useContentPaperRef } from 'app/layouts/PageLayout';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { T } from 'lib/i18n';

import { EmptySection } from './EmptySection';
import { UpdateAppBanner } from './UpdateAppBanner';

interface TokensTabBaseProps {
  tokensView: JSX.Element[];
  tokensCount: number;
  searchValue: string;
  loadNextPage: EmptyFn;
  onSearchValueChange: (value: string) => void;
  isSyncing: boolean;
}

export const TokensTabBase: FC<TokensTabBaseProps> = ({
  tokensView,
  tokensCount,
  searchValue,
  loadNextPage,
  onSearchValueChange,
  isSyncing
}) => {
  const { manageActive, setManageInactive, toggleManageActive } = useManageAssetsState();
  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputContainerRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef(null);
  const contentPaperRef = useContentPaperRef();
  const assetsSegmentControlRef = useAssetsSegmentControlRef();

  useOnClickOutside(
    containerRef,
    manageActive
      ? evt => {
          const evtTarget = evt.target as Node;

          const isManageButtonClick = Boolean(manageButtonRef.current && manageButtonRef.current.contains(evtTarget));
          const isSearchInputClick = Boolean(
            searchInputContainerRef.current && searchInputContainerRef.current.contains(evtTarget)
          );
          const isSegmentControlClick = Boolean(
            assetsSegmentControlRef.current && assetsSegmentControlRef.current.contains(evtTarget)
          );
          const isInsideContentClick = Boolean(contentPaperRef.current && contentPaperRef.current.contains(evtTarget));

          if (!isSearchInputClick && !isManageButtonClick && !isSegmentControlClick && isInsideContentClick) {
            setManageInactive();
          }
        }
      : null
  );

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
        <ContentContainer ref={containerRef} padding={tokensCount > 0}>
          {!manageActive && <UpdateAppBanner stickyBarRef={stickyBarRef} />}

          {tokensCount === 0 ? (
            <EmptySection />
          ) : (
            <>
              {manageActive && (
                <div className="flex flex-row bg-secondary-low p-3 mb-4 gap-x-1 rounded-md">
                  <IconBase Icon={InfoFillIcon} size={24} className="text-secondary" />
                  <p className="text-font-description">
                    <T id="manageAssetsSearchTip" />
                  </p>
                </div>
              )}
              <SimpleInfiniteScroll loadNext={loadNextPage}>{tokensView}</SimpleInfiniteScroll>
              {isSyncing && <SyncSpinner className="mt-4" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
};
