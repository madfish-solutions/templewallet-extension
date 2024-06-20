import React, { FC, useMemo, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useEvmChainAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';

import { EmptySection } from './EmptySection';
import { EvmListItem } from './ListItem';

interface EvmChainTokensTabProps {
  chainId: number;
  publicKeyHash: HexString;
}

export const EvmChainTokensTab: FC<EvmChainTokensTabProps> = ({ chainId, publicKeyHash }) => {
  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const { paginatedSlugs, isSyncing, loadNext } = useEvmChainAccountTokensListingLogic(publicKeyHash, chainId);

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
              {isSyncing && <SyncSpinner className="mt-4" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
};
