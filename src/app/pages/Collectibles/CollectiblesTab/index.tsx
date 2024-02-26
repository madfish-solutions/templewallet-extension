import React, { FC, memo, useCallback, useEffect, useMemo } from 'react';

import clsx from 'clsx';
import { isEqual } from 'lodash';

import { SyncSpinner } from 'app/atoms';
import Checkbox from 'app/atoms/Checkbox';
import Divider from 'app/atoms/Divider';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { ScrollBackUpButton } from 'app/atoms/ScrollBackUpButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAppEnv } from 'app/env';
import { useCollectiblesListingLogic } from 'app/hooks/use-collectibles-listing-logic';
import { ReactComponent as EditingIcon } from 'app/icons/editing.svg';
import {
  LOCAL_STORAGE_ADULT_BLUR_TOGGLE_KEY,
  LOCAL_STORAGE_SHOW_INFO_TOGGLE_KEY
} from 'app/pages/Collectibles/constants';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { ButtonForManageDropdown } from 'app/templates/ManageDropdown';
import SearchAssetField from 'app/templates/SearchAssetField';
import { setTestID } from 'lib/analytics';
import { useEnabledAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { AssetTypesEnum } from 'lib/assets/types';
import { useCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { T, t } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useLocalStorage } from 'lib/ui/local-storage';
import Popper, { PopperChildren, PopperPopup, PopperRenderProps } from 'lib/ui/Popper';
import { Link } from 'lib/woozie';

import { CollectibleItem } from './CollectibleItem';
import { CollectibleTabSelectors } from './selectors';

interface Props {
  scrollToTheTabsBar: EmptyFn;
}

export const CollectiblesTab = memo<Props>(({ scrollToTheTabsBar }) => {
  const { popup } = useAppEnv();
  const { publicKeyHash } = useAccount();
  const chainId = useChainId()!;

  const [areDetailsShown, setDetailsShown] = useLocalStorage(LOCAL_STORAGE_SHOW_INFO_TOGGLE_KEY, false);
  const toggleDetailsShown = useCallback(() => void setDetailsShown(val => !val), [setDetailsShown]);

  const [adultBlur, setAdultBlur] = useLocalStorage(LOCAL_STORAGE_ADULT_BLUR_TOGGLE_KEY, true);
  const toggleAdultBlur = useCallback(() => void setAdultBlur(val => !val), [setAdultBlur]);

  const allSlugs = useEnabledAccountCollectiblesSlugs();

  const assetsSortPredicate = useCollectiblesSortPredicate();

  const allSlugsSorted = useMemoWithCompare(
    () => [...allSlugs].sort(assetsSortPredicate),
    [allSlugs, assetsSortPredicate],
    isEqual
  );

  const { isInSearchMode, displayedSlugs, paginatedSlugs, isSyncing, loadNext, searchValue, setSearchValue } =
    useCollectiblesListingLogic(allSlugsSorted);

  const shouldScrollToTheTabsBar = paginatedSlugs.length > 0;
  useEffect(() => {
    if (shouldScrollToTheTabsBar) void scrollToTheTabsBar();
  }, [shouldScrollToTheTabsBar, scrollToTheTabsBar]);

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-1">
        {displayedSlugs.map(slug => (
          <CollectibleItem
            key={slug}
            assetSlug={slug}
            accountPkh={publicKeyHash}
            chainId={chainId}
            adultBlur={adultBlur}
            areDetailsShown={areDetailsShown}
            hideWithoutMeta={isInSearchMode}
          />
        ))}
      </div>
    ),
    [displayedSlugs, publicKeyHash, chainId, adultBlur, areDetailsShown, isInSearchMode]
  );

  const renderManageDropdown = useCallback<PopperPopup>(
    props => (
      <ManageButtonDropdown
        {...props}
        areDetailsShown={areDetailsShown}
        adultBlur={adultBlur}
        toggleDetailsShown={toggleDetailsShown}
        toggleAdultBlur={toggleAdultBlur}
      />
    ),
    [areDetailsShown, adultBlur, toggleDetailsShown, toggleAdultBlur]
  );

  const renderManageButton = useCallback<PopperChildren>(
    ({ ref, opened, toggleOpened }) => (
      <ButtonForManageDropdown
        ref={ref}
        opened={opened}
        tooltip={t('manageAssetsList')}
        onClick={toggleOpened}
        testID={AssetsSelectors.manageButton}
        testIDProperties={{ listOf: 'Collectibles' }}
      />
    ),
    []
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={clsx('my-3', popup && 'mx-4')}>
        <div className="relative mb-4 w-full flex">
          <SearchAssetField
            value={searchValue}
            onValueChange={setSearchValue}
            containerClassName="mr-2"
            testID={AssetsSelectors.searchAssetsInputCollectibles}
          />

          <Popper placement="bottom-end" strategy="fixed" popup={renderManageDropdown}>
            {renderManageButton}
          </Popper>
        </div>

        {displayedSlugs.length === 0 ? (
          buildEmptySection(isSyncing)
        ) : (
          <>
            {isInSearchMode ? (
              contentElement
            ) : (
              <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
            )}

            <ScrollBackUpButton />

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </div>
    </div>
  );
});

const buildEmptySection = (isSyncing: boolean) =>
  isSyncing ? (
    <SyncSpinner className="mt-6" />
  ) : (
    <div className="w-full border rounded border-gray-200">
      <p className={'text-gray-600 text-center text-xs py-6'} {...setTestID(CollectibleTabSelectors.emptyStateText)}>
        <T id="zeroCollectibleText" />
      </p>
    </div>
  );

interface ManageButtonDropdownProps extends PopperRenderProps {
  areDetailsShown: boolean;
  adultBlur: boolean;
  toggleDetailsShown: EmptyFn;
  toggleAdultBlur: EmptyFn;
}

const ManageButtonDropdown: FC<ManageButtonDropdownProps> = ({
  opened,
  areDetailsShown,
  adultBlur,
  toggleDetailsShown,
  toggleAdultBlur
}) => {
  const buttonClassName = 'flex items-center px-3 py-2.5 rounded hover:bg-gray-200 cursor-pointer';

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right p-2 flex flex-col min-w-40"
      style={{ border: 'unset', marginTop: '0.25rem' }}
    >
      <Link
        to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
        className={buttonClassName}
        testID={AssetsSelectors.dropdownManageButton}
        testIDProperties={{ listOf: 'Collectibles' }}
      >
        <EditingIcon className="w-4 h-4 stroke-current fill-current text-gray-600" />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="manage" />
        </span>
      </Link>

      <Divider className="my-2" />

      <label className={buttonClassName}>
        <Checkbox
          overrideClassNames="h-4 w-4 rounded"
          checked={areDetailsShown}
          onChange={toggleDetailsShown}
          testID={AssetsSelectors.dropdownShowInfoCheckbox}
        />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="showInfo" />
        </span>
      </label>

      <Divider className="my-2" />

      <label className={buttonClassName}>
        <Checkbox
          overrideClassNames="h-4 w-4 rounded"
          checked={adultBlur}
          onChange={toggleAdultBlur}
          testID={AssetsSelectors.dropdownBlurCheckbox}
        />
        <span className="text-sm text-gray-600 ml-2 leading-5">
          <T id="blur" />
        </span>
      </label>
    </DropdownWrapper>
  );
};
