import React, { memo, useMemo, useRef } from 'react';

import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { StayActiveIconButton } from 'app/atoms/IconButton';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options-state';
import { useAccountCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { useEnabledAccountChainCollectiblesSlugs } from 'lib/assets/hooks/collectibles';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItem, TezosCollectibleItem } from './CollectibleItem';
import { EmptySection } from './EmptySection';

interface MultiChainCollectiblesTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainCollectiblesTab = memo<MultiChainCollectiblesTabProps>(
  ({ accountTezAddress, accountEvmAddress }) => {
    const { blur, showInfo } = useCollectiblesListOptionsSelector();

    const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

    const allChainSlugs = useEnabledAccountChainCollectiblesSlugs(accountTezAddress, accountEvmAddress);

    const assetsSortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);

    const allChainSlugsSorted = useMemoWithCompare(
      () => [...allChainSlugs].sort(assetsSortPredicate),
      [allChainSlugs, assetsSortPredicate],
      isEqual
    );

    const { isInSearchMode, displayedSlugs, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
      useAccountCollectiblesListingLogic(allChainSlugsSorted);

    const contentElement = useMemo(
      () => (
        <div className="grid grid-cols-3 gap-2">
          {displayedSlugs.map(chainSlug => {
            const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

            if (chainKind === TempleChainKind.Tezos) {
              return (
                <TezosCollectibleItem
                  key={chainSlug}
                  assetSlug={slug}
                  accountPkh={accountTezAddress}
                  tezosChainId={chainId as string}
                  adultBlur={blur}
                  areDetailsShown={showInfo}
                  hideWithoutMeta={isInSearchMode}
                />
              );
            }

            return (
              <EvmCollectibleItem
                key={chainSlug}
                assetSlug={slug}
                evmChainId={chainId as number}
                accountPkh={accountEvmAddress}
                showDetails={showInfo}
              />
            );
          })}
        </div>
      ),
      [isInSearchMode, accountEvmAddress, accountTezAddress, blur, displayedSlugs, showInfo]
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

          <StayActiveIconButton Icon={ManageIcon} />
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
  }
);
