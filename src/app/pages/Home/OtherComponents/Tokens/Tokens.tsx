import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { ChainIds } from '@taquito/taquito';
import clsx from 'clsx';

import { SyncSpinner, Divider, Checkbox } from 'app/atoms';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useAppEnv } from 'app/env';
import { useTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as EditingIcon } from 'app/icons/editing.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { dispatch } from 'app/store';
import { useAreAssetsLoading, useMainnetTokensScamlistSelector } from 'app/store/assets/selectors';
import { setShouldShowTermsOfUseUpdateOverlayAction } from 'app/store/settings/actions';
import {
  useAcceptedTermsVersionSelector,
  useShouldShowTermsOfUseUpdateOverlaySelector
} from 'app/store/settings/selectors';
import { ButtonForManageDropdown } from 'app/templates/ManageDropdown';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import SearchAssetField from 'app/templates/SearchAssetField';
import { setTestID } from 'lib/analytics';
import { TEZ_TOKEN_SLUG, TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokensSlugs } from 'lib/assets/hooks';
import { RECENT_TERMS_VERSION } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useLocalStorage } from 'lib/ui/local-storage';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { Link, navigate } from 'lib/woozie';

import { HomeSelectors } from '../../Home.selectors';
import { AssetsSelectors } from '../Assets.selectors';

import { ListItem } from './components/ListItem';
import { TermsOfUseUpdateBanner } from './components/TermsOfUseUpdateBanner';
import { TermsOfUseUpdateOverlay } from './components/TermsOfUseUpdateOverlay';
import { UpdateAppBanner } from './components/UpdateAppBanner';
import { toExploreAssetLink } from './utils';

const LOCAL_STORAGE_TOGGLE_KEY = 'tokens-list:hide-zero-balances';
const svgIconClassName = 'w-4 h-4 stroke-current fill-current text-gray-600';

export const TokensTab = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const { popup } = useAppEnv();

  const isSyncing = useAreAssetsLoading('tokens');

  const slugs = useEnabledAccountTokensSlugs();

  const [isZeroBalancesHidden, setIsZeroBalancesHidden] = useLocalStorage(LOCAL_STORAGE_TOGGLE_KEY, false);

  const toggleHideZeroBalances = useCallback(
    () => void setIsZeroBalancesHidden(val => !val),
    [setIsZeroBalancesHidden]
  );

  const leadingAssets = useMemo(
    () => (chainId === ChainIds.MAINNET ? [TEZ_TOKEN_SLUG, TEMPLE_TOKEN_SLUG] : [TEZ_TOKEN_SLUG]),
    [chainId]
  );

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const acceptedTermsVersion = useAcceptedTermsVersionSelector();

  const { filteredAssets, searchValue, setSearchValue } = useTokensListingLogic(
    slugs,
    isZeroBalancesHidden,
    leadingAssets
  );

  const shouldShowTermsOfUseOverlay = useShouldShowTermsOfUseUpdateOverlaySelector();
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

  const showTermsOfUseUpdateOverlay = useCallback(() => dispatch(setShouldShowTermsOfUseUpdateOverlayAction(true)), []);
  const hideTermsOfUseUpdateOverlay = useCallback(
    () => dispatch(setShouldShowTermsOfUseUpdateOverlayAction(false)),
    []
  );

  const activeAssetSlug = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  const tokensView = useMemo<JSX.Element[]>(() => {
    const tokensJsx = filteredAssets.map(assetSlug => (
      <ListItem
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
  }, [filteredAssets, activeAssetSlug, publicKeyHash, mainnetTokensScamSlugsRecord]);

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
          navigate(toExploreAssetLink(activeAssetSlug));
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
  }, [activeAssetSlug, setActiveIndex]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={clsx('my-3 w-full flex', popup && 'px-4')}>
        <SearchAssetField
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
          containerClassName="mr-2"
          testID={AssetsSelectors.searchAssetsInputTokens}
        />

        <Popper
          placement="bottom-end"
          strategy="fixed"
          popup={props => (
            <ManageButtonDropdown
              {...props}
              isZeroBalancesHidden={isZeroBalancesHidden}
              toggleHideZeroBalances={toggleHideZeroBalances}
            />
          )}
        >
          {({ ref, opened, toggleOpened }) => (
            <ButtonForManageDropdown
              ref={ref}
              opened={opened}
              tooltip={t('manageAssetsList')}
              onClick={toggleOpened}
              testID={AssetsSelectors.manageButton}
              testIDProperties={{ listOf: 'Tokens' }}
            />
          )}
        </Popper>
      </div>

      {acceptedTermsVersion === RECENT_TERMS_VERSION ? (
        <UpdateAppBanner popup={popup} />
      ) : (
        <TermsOfUseUpdateBanner popup={popup} onReviewClick={showTermsOfUseUpdateOverlay} />
      )}

      {filteredAssets.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
            {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

            <span {...setTestID(HomeSelectors.emptyStateText)}>
              <T id="noAssetsFound" />
            </span>
          </p>

          <p className="text-center text-xs font-light">
            <T
              id="ifYouDontSeeYourAsset"
              substitutions={[
                <b>
                  <T id="manage" />
                </b>
              ]}
            />
          </p>
        </div>
      ) : (
        <div className="flex flex-col w-full overflow-hidden rounded-md text-gray-700 text-sm leading-tight">
          {tokensView}
        </div>
      )}

      {isSyncing && <SyncSpinner className="mt-4" />}
      {shouldShowTermsOfUseOverlay && <TermsOfUseUpdateOverlay onClose={hideTermsOfUseUpdateOverlay} />}
    </div>
  );
});

interface ManageButtonDropdownProps extends PopperRenderProps {
  isZeroBalancesHidden: boolean;
  toggleHideZeroBalances: EmptyFn;
}

const ManageButtonDropdown: FC<ManageButtonDropdownProps> = ({
  opened,
  isZeroBalancesHidden,
  toggleHideZeroBalances
}) => {
  const buttonClassName = 'flex items-center px-3 py-2.5 rounded hover:bg-gray-200 cursor-pointer';

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right p-2 flex flex-col min-w-40"
      style={{ border: 'unset', marginTop: '0.25rem' }}
    >
      <Link
        to={`/manage-assets`}
        className={buttonClassName}
        testID={AssetsSelectors.dropdownManageButton}
        testIDProperties={{ listOf: 'Tokens' }}
      >
        <EditingIcon className={svgIconClassName} />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="manage" />
        </span>
      </Link>

      <Divider className="my-2" />

      <label className={buttonClassName}>
        <Checkbox
          overrideClassNames="h-4 w-4 rounded"
          checked={isZeroBalancesHidden}
          onChange={toggleHideZeroBalances}
          testID={AssetsSelectors.dropdownHideZeroBalancesCheckbox}
        />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="hideZeroBalance" />
        </span>
      </label>
    </DropdownWrapper>
  );
};
