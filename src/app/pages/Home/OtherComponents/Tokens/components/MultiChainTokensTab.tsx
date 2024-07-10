import React, { memo, useMemo, useRef } from 'react';

import clsx from 'clsx';
import useOnClickOutside from 'use-onclickoutside';

import { IconBase, SyncSpinner } from 'app/atoms';
import { useAssetsSegmentControlRef } from 'app/atoms/AssetsSegmentControl';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAccountTokensListingLogic } from 'app/hooks/tokens-listing-logic/use-account-tokens-listing-logic';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options-state';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { useContentPaperRef } from 'app/layouts/PageLayout';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { SearchBarField } from 'app/templates/SearchField';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
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
  const { manageActive, setManageInactive, toggleManageActive } = useManageAssetsState();

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
          if (manageActive) return null;

          return (
            <div key={chainSlug} className={clsx('mb-0.5 p-1 text-font-description-bold', index > 0 && 'mt-4')}>
              {chainSlug}
            </div>
          );
        }

        const [chainKind, chainId, assetSlug] = fromChainAssetSlug(chainSlug);

        if (chainKind === TempleChainKind.Tezos) {
          return (
            <TezosListItem
              network={tezosChains[chainId]}
              key={chainSlug}
              publicKeyHash={accountTezAddress}
              assetSlug={assetSlug}
              manageActive={manageActive}
            />
          );
        }

        return (
          <EvmListItem
            key={chainSlug}
            chainId={chainId as number}
            assetSlug={assetSlug}
            publicKeyHash={accountEvmAddress}
            manageActive={manageActive}
          />
        );
      }),
    [paginatedSlugs, tezosChains, manageActive]
  );

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
          onValueChange={setSearchValue}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton ref={manageButtonRef} Icon={ManageIcon} active={manageActive} onClick={toggleManageActive} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer ref={containerRef} padding={paginatedSlugs.length > 0}>
          {paginatedSlugs.length === 0 ? (
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
              <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
              {isSyncing && <SyncSpinner className="mt-4" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
});
