import React, { memo, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useAllTezosChains, useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EmptySection } from './EmptySection';
import { EvmListItem, TezosListItem } from './ListItem';

interface MultiChainTokensTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const MultiChainTokensTab = memo<MultiChainTokensTabProps>(({ accountTezAddress, accountEvmAddress }) => {
  const { hideZeroBalance, groupByNetwork } = useTokensListOptionsSelector();

  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const tezosChains = useAllTezosChains();

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const leadingAssets = useMemo(
    () => [
      ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
      ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
    ],
    [enabledTezChains, enabledEvmChains]
  );

  const { paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } = useAccountTokensListingLogic(
    accountTezAddress,
    accountEvmAddress,
    hideZeroBalance,
    groupByNetwork,
    leadingAssets,
    true
  );

  const contentElement = useMemo(
    () =>
      paginatedSlugs.map((chainSlug, index) => {
        if (!chainSlug.includes(CHAIN_SLUG_SEPARATOR)) {
          return <div className={clsx('mb-0.5 p-1 text-font-description-bold', index > 0 && 'mt-4')}>{chainSlug}</div>;
        }

        const [chainKind, chainId, assetSlug] = fromChainAssetSlug(chainSlug);

        if (chainKind === TempleChainKind.Tezos) {
          return (
            <TezosListItem
              network={tezosChains[chainId]}
              key={chainSlug}
              publicKeyHash={accountTezAddress}
              assetSlug={assetSlug}
            />
          );
        }

        return (
          <EvmListItem
            key={chainSlug}
            chainId={chainId as number}
            assetSlug={assetSlug}
            publicKeyHash={accountEvmAddress}
          />
        );
      }),
    [paginatedSlugs, tezosChains]
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
});
