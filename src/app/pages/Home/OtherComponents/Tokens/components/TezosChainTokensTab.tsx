import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { useTezosTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { TEMPLE_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokensSlugs } from 'lib/assets/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { useTezosChainByChainId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { toExploreAssetLink } from '../utils';

import { EmptySection } from './EmptySection';
import { TezosListItem } from './ListItem';
import { UpdateAppBanner } from './UpdateAppBanner';

interface TezosChainTokensTabProps {
  chainId: string;
  publicKeyHash: string;
}

export const TezosChainTokensTab: FC<TezosChainTokensTabProps> = ({ chainId, publicKeyHash }) => {
  const network = useTezosChainByChainId(chainId);

  if (!network) throw new DeadEndBoundaryError();

  const { tokensListOptions } = useAssetsFilterOptionsSelector();
  const [filtersOpened, _, setFiltersClosed, toggleFiltersOpened] = useBooleanState(false);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isSyncing = assetsAreLoading || metadatasLoading;

  const slugs = useEnabledAccountTokensSlugs(publicKeyHash, chainId);

  const leadingAssets = useMemo(
    () => (chainId === TEZOS_MAINNET_CHAIN_ID ? [TEZ_TOKEN_SLUG, TEMPLE_TOKEN_SLUG] : [TEZ_TOKEN_SLUG]),
    [chainId]
  );

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();

  const { filteredAssets, searchValue, setSearchValue } = useTezosTokensListingLogic(
    chainId,
    publicKeyHash,
    slugs,
    tokensListOptions.hideZeroBalance,
    leadingAssets
  );

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

  const activeAssetSlug = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  const tokensView = useMemo<JSX.Element[]>(() => {
    const tokensJsx = filteredAssets.map(assetSlug => (
      <TezosListItem
        network={network}
        key={assetSlug}
        publicKeyHash={publicKeyHash}
        assetSlug={assetSlug}
        scam={mainnetTokensScamSlugsRecord[assetSlug]}
        active={activeAssetSlug ? assetSlug === activeAssetSlug : false}
      />
    ));

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
  }, [network, filteredAssets, activeAssetSlug, publicKeyHash, mainnetTokensScamSlugsRecord]);

  useLoadPartnersPromo(OptimalPromoVariantEnum.Token);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  const handleSearchFieldFocus = useCallback(() => void setSearchFocused(true), [setSearchFocused]);
  const handleSearchFieldBlur = useCallback(() => void setSearchFocused(false), [setSearchFocused]);

  useEffect(() => {
    if (!activeAssetSlug) return;

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
  }, [activeAssetSlug, chainId, setActiveIndex]);

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton Icon={ManageIcon} />
      </StickyBar>

      {filtersOpened ? (
        <AssetsFilterOptions filterButtonRef={filterButtonRef} onRequestClose={setFiltersClosed} />
      ) : (
        <ContentContainer>
          <UpdateAppBanner stickyBarRef={stickyBarRef} />

          {filteredAssets.length === 0 ? (
            <EmptySection isSyncing={isSyncing} searchValueExist={searchValueExist} />
          ) : (
            <>
              <>{tokensView}</>
              {isSyncing && <SyncSpinner className="mt-4" />}
            </>
          )}
        </ContentContainer>
      )}
    </>
  );
};
