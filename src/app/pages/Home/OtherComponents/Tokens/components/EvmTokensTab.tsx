import React, { FC, useMemo, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useEvmAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useBooleanState } from 'lib/ui/hooks';

import { EmptySection } from './EmptySection';
import { EvmListItem } from './ListItem';

interface EvmTokensTabProps {
  publicKeyHash: HexString;
}

export const EvmTokensTab: FC<EvmTokensTabProps> = ({ publicKeyHash }) => {
  const [filtersOpened, _, setFiltersClosed, toggleFiltersOpened] = useBooleanState(false);

  const { paginatedSlugs, isSyncing, loadNext } = useEvmAccountTokensListingLogic(publicKeyHash);

  const contentElement = useMemo(
    () =>
      paginatedSlugs.map(chainSlug => {
        const [chainId, slug] = fromChainAssetSlug<number>(chainSlug);

        return <EvmListItem key={slug} chainId={chainId} assetSlug={slug} publicKeyHash={publicKeyHash} />;
      }),
    [paginatedSlugs]
  );

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          value="Not working yet"
          onValueChange={emptyFn}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

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
