import React, { FC, useMemo, useRef } from 'react';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useEvmChainAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

import { EmptySection } from './EmptySection';
import { EvmListItem } from './ListItem';

interface EvmChainTokensTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainTokensTab: FC<EvmChainTokensTabProps> = ({ chainId, publicKeyHash }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const leadingAssets = useMemo(() => [EVM_TOKEN_SLUG], []);

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmChainAccountTokensListingLogic(
    publicKeyHash,
    chainId,
    hideZeroBalance,
    leadingAssets
  );

  const contentElement = useMemo(
    () =>
      paginatedSlugs.map(slug => (
        <EvmListItem key={slug} assetSlug={slug} publicKeyHash={publicKeyHash} chainId={chainId} />
      )),
    [paginatedSlugs]
  );

  const stickyBarRef = useRef<HTMLDivElement>(null);
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
        <ContentContainer padding={paginatedSlugs.length > 0}>
          {paginatedSlugs.length === 0 ? (
            <EmptySection />
          ) : (
            <>
              <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
              {isSyncing && <SyncSpinner className="mt-4" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
};
