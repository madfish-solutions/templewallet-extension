import React, { memo, useMemo, useRef } from 'react';

import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useEvmAccountCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { useEnabledEvmAccountCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { useEvmAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';

import { EvmCollectibleItem } from './CollectibleItem';
import { EmptySection } from './EmptySection';

interface EvmCollectiblesTabProps {
  publicKeyHash: HexString;
}

export const EvmCollectiblesTab = memo<EvmCollectiblesTabProps>(({ publicKeyHash }) => {
  const { showInfo } = useCollectiblesListOptionsSelector();
  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const allSlugs = useEnabledEvmAccountCollectiblesSlugs(publicKeyHash);

  const assetsSortPredicate = useEvmAccountCollectiblesSortPredicate(publicKeyHash);

  const allSlugsSorted = useMemoWithCompare(
    () => [...allSlugs].sort(assetsSortPredicate),
    [allSlugs, assetsSortPredicate],
    isEqual
  );

  const { displayedSlugs, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useEvmAccountCollectiblesListingLogic(allSlugsSorted);

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-2">
        {displayedSlugs.map(chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

          return (
            <EvmCollectibleItem
              key={chainSlug}
              assetSlug={slug}
              evmChainId={chainId}
              accountPkh={publicKeyHash}
              showDetails={showInfo}
            />
          );
        })}
      </div>
    ),
    [displayedSlugs, publicKeyHash, showInfo]
  );

  const shouldScrollToTheBar = paginatedSlugs.length > 0;

  const stickyBarRef = useScrollIntoView<HTMLDivElement>(shouldScrollToTheBar, { behavior: 'smooth' });
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          value={searchValue}
          onValueChange={setSearchValue}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton Icon={ManageIcon} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer>
          {displayedSlugs.length === 0 ? (
            <EmptySection isSyncing={isSyncing} />
          ) : (
            <>
              <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>

              <ScrollBackUpButton />

              {isSyncing && <SyncSpinner className="mt-6" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
});
