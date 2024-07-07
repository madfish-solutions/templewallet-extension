import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import useOnClickOutside from 'use-onclickoutside';

import { IconBase, SyncSpinner } from 'app/atoms';
import { useAssetsSegmentControlRef } from 'app/atoms/AssetsSegmentControl';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options-state';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useManageAssetsState } from 'app/hooks/use-manage-assets-state';
import { useTezosAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { useContentPaperRef } from 'app/layouts/PageLayout';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { TEMPLE_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosEnabledAccountTokensSlugs } from 'lib/assets/hooks/tokens';
import { CHAIN_SLUG_SEPARATOR, fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { navigate } from 'lib/woozie';
import { useAllTezosChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { toExploreAssetLink } from '../utils';

import { EmptySection } from './EmptySection';
import { TezosListItem } from './ListItem';
import { UpdateAppBanner } from './UpdateAppBanner';

interface TezosTokensTabProps {
  publicKeyHash: string;
}

export const TezosTokensTab: FC<TezosTokensTabProps> = ({ publicKeyHash }) => {
  const { filterChain, tokensListOptions } = useAssetsFilterOptionsSelector();
  const { filtersOpened, setFiltersClosed, toggleFiltersOpened } = useAssetsFilterOptionsState();
  const { manageActive, setManageInactive, toggleManageActive } = useManageAssetsState();

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

  const chainSlugs = useTezosEnabledAccountTokensSlugs(publicKeyHash);

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const tezosChains = useAllTezosChains();
  const enabledChains = useEnabledTezosChains();

  const leadingAssets = useMemo(() => {
    const nativeChainSlugs = enabledChains.map(chain =>
      toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)
    );

    return !filterChain || filterChain.chainId === TEZOS_MAINNET_CHAIN_ID
      ? [...nativeChainSlugs, toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEMPLE_TOKEN_SLUG)]
      : nativeChainSlugs;
  }, [enabledChains, filterChain]);

  const { filteredAssets, searchValue, setSearchValue } = useTezosAccountTokensListingLogic(
    publicKeyHash,
    chainSlugs,
    tokensListOptions.hideZeroBalance,
    tokensListOptions.groupByNetwork,
    leadingAssets
  );

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

  const activeChainAssetSlug = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  const tokensView = useMemo(() => {
    const tokensJsx = filteredAssets.map((chainSlug, index) => {
      if (!chainSlug.includes(CHAIN_SLUG_SEPARATOR)) {
        if (manageActive) return null;

        return (
          <div key={chainSlug} className={clsx('mb-0.5 p-1 text-font-description-bold', index > 0 && 'mt-4')}>
            {chainSlug}
          </div>
        );
      }

      const [_, chainId, assetSlug] = fromChainAssetSlug<string>(chainSlug);

      return (
        <TezosListItem
          network={tezosChains[chainId]}
          key={chainSlug}
          publicKeyHash={publicKeyHash}
          assetSlug={assetSlug}
          scam={mainnetTokensScamSlugsRecord[assetSlug]}
          active={activeChainAssetSlug ? chainSlug === activeChainAssetSlug : false}
          manageActive={manageActive}
        />
      );
    });

    const promoJsx = (
      <PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionVariant.Text}
        pageName="Token page"
      />
    );

    if (filteredAssets.length < 5) {
      tokensJsx.push(promoJsx);
    } else {
      tokensJsx.splice(1, 0, promoJsx);
    }

    return tokensJsx;
  }, [filteredAssets, tezosChains, publicKeyHash, mainnetTokensScamSlugsRecord, activeChainAssetSlug, manageActive]);

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  const handleSearchFieldFocus = useCallback(() => void setSearchFocused(true), [setSearchFocused]);
  const handleSearchFieldBlur = useCallback(() => void setSearchFocused(false), [setSearchFocused]);

  useEffect(() => {
    if (!activeChainAssetSlug) return;

    const [_, chainId, activeAssetSlug] = fromChainAssetSlug<string>(activeChainAssetSlug);

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Enter':
          navigate(toExploreAssetLink(TempleChainKind.Tezos, chainId, activeAssetSlug));
          break;

        case 'ArrowDown':
          setActiveIndex(i => i + 1);
          break;

        case 'ArrowUp':
          setActiveIndex(i => (i > 0 ? i - 1 : 0));
          break;
      }
    };

    window.addEventListener('keyup', handleKeyup);
    return () => window.removeEventListener('keyup', handleKeyup);
  }, [activeChainAssetSlug, setActiveIndex]);

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
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton ref={manageButtonRef} Icon={ManageIcon} active={manageActive} onClick={toggleManageActive} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer ref={containerRef} padding={filteredAssets.length > 0}>
          {!manageActive && <UpdateAppBanner stickyBarRef={stickyBarRef} />}

          {filteredAssets.length === 0 ? (
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
              <>{tokensView}</>
              {isSyncing && <SyncSpinner className="mt-4" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
};
