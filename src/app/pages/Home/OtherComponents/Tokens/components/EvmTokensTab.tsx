import React, { FC, useMemo, useRef } from 'react';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useEvmAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EmptySection } from './EmptySection';
import { EvmListItem } from './ListItem';

interface EvmTokensTabProps {
  publicKeyHash: HexString;
}

export const EvmTokensTab: FC<EvmTokensTabProps> = ({ publicKeyHash }) => {
  const { hideZeroBalance } = useTokensListOptionsSelector();

  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const enabledChains = useEnabledEvmChains();

  const leadingAssets = useMemo(
    () => enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
    [enabledChains]
  );

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useEvmAccountTokensListingLogic(
    publicKeyHash,
    hideZeroBalance,
    leadingAssets,
    true
  );

  const contentElement = useMemo(
    () =>
      paginatedSlugs.map(chainSlug => {
        const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

        return <EvmListItem key={chainSlug} chainId={chainId} assetSlug={slug} publicKeyHash={publicKeyHash} />;
      }),
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
