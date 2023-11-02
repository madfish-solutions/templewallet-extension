import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import { isEqual } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDebounce } from 'use-debounce';

import { SyncSpinner } from 'app/atoms';
import Checkbox from 'app/atoms/Checkbox';
import Divider from 'app/atoms/Divider';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useAppEnv } from 'app/env';
import { ReactComponent as EditingIcon } from 'app/icons/editing.svg';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useAreAssetsLoading } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { ButtonForManageDropdown } from 'app/templates/ManageDropdown';
import SearchAssetField from 'app/templates/SearchAssetField';
import { useEnabledAccountCollectiblesSlugs } from 'lib/assets/hooks';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { AssetTypesEnum } from 'lib/assets/types';
import { useCollectiblesSortPredicate } from 'lib/assets/use-filtered';
import { T, t } from 'lib/i18n';
import { useAssetsMetadataWithPresenceCheck } from 'lib/metadata';
import { useAccount } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useLocalStorage } from 'lib/ui/local-storage';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { Link } from 'lib/woozie';

import { CollectibleItem } from './CollectibleItem';
import { ITEMS_PER_PAGE, useCollectiblesWithLoading } from './use-collectibles';

const LOCAL_STORAGE_TOGGLE_KEY = 'collectibles-grid:show-items-details';

interface Props {
  scrollToTheTabsBar: EmptyFn;
}

export const CollectiblesTab = memo<Props>(({ scrollToTheTabsBar }) => {
  const { popup } = useAppEnv();
  const { publicKeyHash } = useAccount();

  const [areDetailsShown, setDetailsShown] = useLocalStorage(LOCAL_STORAGE_TOGGLE_KEY, false);
  const toggleDetailsShown = useCallback(() => void setDetailsShown(val => !val), [setDetailsShown]);

  const allEnabledSlugs = useEnabledAccountCollectiblesSlugs();
  const assetsAreLoading = useAreAssetsLoading('collectibles');
  const tokensMetadataLoading = useTokensMetadataLoadingSelector();

  const assetsSortPredicate = useCollectiblesSortPredicate();

  const allEnabledSlugsSorted = useMemoWithCompare(
    () => [...allEnabledSlugs].sort(assetsSortPredicate),
    [allEnabledSlugs, assetsSortPredicate],
    isEqual
  );

  const { slugs, isLoading, loadNext, loadNextSeed } = useCollectiblesWithLoading(allEnabledSlugsSorted);
  console.log('LOADING:', isLoading, assetsAreLoading, tokensMetadataLoading);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearch = isSearchStringApplicable(searchValueDebounced);

  const isSyncing = isInSearch ? assetsAreLoading || tokensMetadataLoading : assetsAreLoading || isLoading;

  const metaToCheckAndLoad = useMemo(() => {
    // Search is not paginated. This is how all needed meta is loaded
    if (isInSearch) return allEnabledSlugsSorted;

    // In pagination, loading meta for the following pages in advance,
    // while not required in current page
    return isLoading ? undefined : allEnabledSlugsSorted.slice(slugs.length + ITEMS_PER_PAGE * 2);
  }, [isInSearch, isLoading, allEnabledSlugsSorted, slugs.length]);

  const allTokensMetadata = useAssetsMetadataWithPresenceCheck(
    metaToCheckAndLoad
    // undefined
  );

  const displayedSlugs = useMemo(
    () =>
      isInSearch
        ? searchAssetsWithNoMeta(searchValueDebounced, allEnabledSlugsSorted, allTokensMetadata, slug => slug).sort(
            assetsSortPredicate
          )
        : slugs,
    [isInSearch, slugs, searchValueDebounced, allEnabledSlugsSorted, allTokensMetadata, assetsSortPredicate]
  );

  console.log('SLUGS:', allEnabledSlugsSorted.length, slugs.length, displayedSlugs.length);
  console.log('META:', allEnabledSlugsSorted.filter(s => !!allTokensMetadata[s]).length);

  const shouldScrollToTheTabsBar = slugs.length > 0;
  useEffect(() => void scrollToTheTabsBar(), [shouldScrollToTheTabsBar, scrollToTheTabsBar]);

  const contentElement = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-1">
        {displayedSlugs.map(slug => (
          <CollectibleItem key={slug} assetSlug={slug} accountPkh={publicKeyHash} areDetailsShown={areDetailsShown} />
        ))}
      </div>
    ),
    [displayedSlugs, publicKeyHash, areDetailsShown]
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={clsx('my-3', popup && 'mx-4')}>
        <div className="mb-4 w-full flex">
          <SearchAssetField
            value={searchValue}
            onValueChange={setSearchValue}
            containerClassName="mr-2"
            testID={AssetsSelectors.searchAssetsInputCollectibles}
          />

          <Popper
            placement="bottom-end"
            strategy="fixed"
            popup={props => (
              <ManageButtonDropdown
                {...props}
                areDetailsShown={areDetailsShown}
                toggleDetailsShown={toggleDetailsShown}
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
                testIDProperties={{ listOf: 'Collectibles' }}
              />
            )}
          </Popper>
        </div>

        {displayedSlugs.length === 0 ? (
          buildEmptySection(isSyncing)
        ) : (
          <>
            {isInSearch ? (
              contentElement
            ) : (
              <InfiniteScroll
                // For grid layout (non-array children) this must be `true`
                hasChildren={true}
                hasMore={true}
                // Used only to determine, whether to call `next` on next scroll-to-end event.
                // Need to update artificially, over cases of `next` calls throwing error
                // and not changing `displayedSlugs.length`.
                dataLength={loadNextSeed}
                next={loadNext}
                // `InfiniteScroll`'s loader conditions r not suited here
                loader={null}
                scrollThreshold={0.95}
              >
                {contentElement}
              </InfiniteScroll>
            )}

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
      <p className={'text-gray-600 text-center text-xs py-6'}>
        <T id="zeroCollectibleText" />
      </p>
    </div>
  );

interface ManageButtonDropdownProps extends PopperRenderProps {
  areDetailsShown: boolean;
  toggleDetailsShown: EmptyFn;
}

const ManageButtonDropdown: FC<ManageButtonDropdownProps> = ({ opened, areDetailsShown, toggleDetailsShown }) => {
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
    </DropdownWrapper>
  );
};
