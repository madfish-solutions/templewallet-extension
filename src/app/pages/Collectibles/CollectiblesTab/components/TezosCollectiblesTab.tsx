import React, { memo, useMemo, useRef } from 'react';

import { isEqual } from 'lodash';
import useOnClickOutside from 'use-onclickoutside';

import { IconBase, SyncSpinner } from 'app/atoms';
import { useAssetsSegmentControlRef } from 'app/atoms/AssetsSegmentControl';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options-state';
import { useTezosAccountCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { useContentPaperRef } from 'app/layouts/PageLayout';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { useTezosEnabledAccountCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { useTezosAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { TezosCollectibleItem } from './CollectibleItem';
import { EmptySection } from './EmptySection';

interface TezosCollectiblesTabProps {
  publicKeyHash: string;
}

export const TezosCollectiblesTab = memo<TezosCollectiblesTabProps>(({ publicKeyHash }) => {
  const { blur, showInfo } = useCollectiblesListOptionsSelector();
  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();
  const { manageActive, setManageInactive, toggleManageActive } = useManageAssetsState();

  const allChainSlugs = useTezosEnabledAccountCollectiblesSlugs(publicKeyHash);

  const assetsSortPredicate = useTezosAccountCollectiblesSortPredicate(publicKeyHash);

  const allChainSlugsSorted = useMemoWithCompare(
    () => [...allChainSlugs].sort(assetsSortPredicate),
    [allChainSlugs, assetsSortPredicate],
    isEqual
  );

  const { isInSearchMode, displayedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useTezosAccountCollectiblesListingLogic(allChainSlugsSorted);

  const contentElement = useMemo(
    () =>
      manageActive ? (
        displayedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);

          return (
            <TezosCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              accountPkh={publicKeyHash}
              tezosChainId={chainId}
              adultBlur={blur}
              areDetailsShown={showInfo}
              hideWithoutMeta={isInSearchMode}
              manageActive
            />
          );
        })
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayedSlugs.map(chainSlug => {
            const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);

            return (
              <TezosCollectibleItem
                key={chainSlug}
                assetSlug={slug}
                accountPkh={publicKeyHash}
                tezosChainId={chainId}
                adultBlur={blur}
                areDetailsShown={showInfo}
                hideWithoutMeta={isInSearchMode}
              />
            );
          })}
        </div>
      ),
    [displayedSlugs, publicKeyHash, blur, showInfo, isInSearchMode, manageActive]
  );

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef(null);
  const contentPaperRef = useContentPaperRef();
  const assetsSegmentControlRef = useAssetsSegmentControlRef();

  useOnClickOutside(
    containerRef,
    manageActive
      ? evt => {
          const evtTarget = evt.target as Node;

          const isManageButtonClick = Boolean(manageButtonRef.current && manageButtonRef.current.contains(evtTarget));
          const isSearchInputClick = Boolean(searchInputRef.current && searchInputRef.current.contains(evtTarget));
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
          ref={searchInputRef}
          value={searchValue}
          onValueChange={setSearchValue}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton ref={manageButtonRef} Icon={ManageIcon} active={manageActive} onClick={toggleManageActive} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer ref={containerRef}>
          {displayedSlugs.length === 0 ? (
            <EmptySection isSyncing={isSyncing} />
          ) : (
            <>
              {isInSearchMode ? (
                contentElement
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
                  <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
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
});
