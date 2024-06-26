import React, { memo, useMemo, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';
import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useEvmCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { useEnabledEvmChainAccountCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { useEvmChainCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';

import { EvmCollectibleItem } from './CollectibleItem';
import { EmptySection } from './EmptySection';

interface EvmChainCollectiblesTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainCollectiblesTab = memo<EvmChainCollectiblesTabProps>(({ chainId, publicKeyHash }) => {
  const { showInfo } = useCollectiblesListOptionsSelector();
  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const allSlugs = useEnabledEvmChainAccountCollectiblesSlugs(publicKeyHash, chainId);

  const assetsSortPredicate = useEvmChainCollectiblesSortPredicate(publicKeyHash, chainId);

  const allSlugsSorted = useMemoWithCompare(
    () => [...allSlugs].sort(assetsSortPredicate),
    [allSlugs, assetsSortPredicate],
    isEqual
  );

  const { paginatedSlugs, isSyncing, loadNext } = useEvmCollectiblesListingLogic(allSlugsSorted);

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-2">
        {paginatedSlugs.map(slug => (
          <EvmCollectibleItem
            key={slug}
            assetSlug={slug}
            evmChainId={chainId}
            accountPkh={publicKeyHash}
            showDetails={showInfo}
          />
        ))}
      </div>
    ),
    [paginatedSlugs, chainId, publicKeyHash, showInfo]
  );

  const shouldScrollToTheBar = paginatedSlugs.length > 0;

  const stickyBarRef = useScrollIntoView<HTMLDivElement>(shouldScrollToTheBar, { behavior: 'smooth' });
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField value="" onValueChange={emptyFn} testID={AssetsSelectors.searchAssetsInputTokens} />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton Icon={ManageIcon} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer>
          {paginatedSlugs.length === 0 ? (
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
