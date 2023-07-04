import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { Button, SyncSpinner } from 'app/atoms';
import Checkbox from 'app/atoms/Checkbox';
import Divider from 'app/atoms/Divider';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useAppEnv } from 'app/env';
import { ReactComponent as EditingIcon } from 'app/icons/editing.svg';
import { ReactComponent as ManageIcon } from 'app/icons/manage.svg';
import { CollectibleItem } from 'app/pages/Collectibles/CollectibleItem';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import SearchAssetField from 'app/templates/SearchAssetField';
import { AssetTypesEnum } from 'lib/assets/types';
import { T, t } from 'lib/i18n';
import { useAccount, useChainId, useCollectibleTokens, useFilteredAssets } from 'lib/temple/front';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { useLocalStorage } from 'lib/ui/local-storage';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { Link } from 'lib/woozie';

const LOCAL_STORAGE_TOGGLE_KEY = 'collectibles-grid:show-items-details';
const svgIconClassName = 'w-4 h-4 stroke-current fill-current text-gray-600';

export const CollectiblesTab = () => {
  const chainId = useChainId(true)!;
  const { popup } = useAppEnv();
  const { publicKeyHash } = useAccount();
  const { isSyncing: tokensAreSyncing } = useSyncTokens();
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const [detailsShown, setDetailsShown] = useLocalStorage(LOCAL_STORAGE_TOGGLE_KEY, false);

  const { data: collectibles = [], isValidating: readingCollectibles } = useCollectibleTokens(
    chainId,
    publicKeyHash,
    true
  );

  const collectibleSlugs = useMemo(() => collectibles.map(collectible => collectible.tokenSlug), [collectibles]);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssets(collectibleSlugs);

  const isSyncing = tokensAreSyncing || metadatasLoading || readingCollectibles;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={clsx('my-3', popup && 'mx-4')}>
        <div className="mb-4 w-full flex items-strech">
          <SearchAssetField
            value={searchValue}
            onValueChange={setSearchValue}
            testID={AssetsSelectors.searchAssetsInputCollectibles}
          />

          <Popper
            placement="bottom-end"
            strategy="fixed"
            popup={props => (
              <ManageButtonDropdown
                {...props}
                detailsShown={detailsShown}
                toggleDetailsShown={() => void setDetailsShown(!detailsShown)}
              />
            )}
          >
            {({ ref, opened, toggleOpened }) => (
              <Button
                ref={ref}
                title={t('manage')}
                className={clsx(
                  'flex flex-shrink-0 items-center justify-center w-10 ml-2 rounded-lg',
                  'transition ease-in-out duration-200 hover:bg-gray-200',
                  'opacity-75 hover:opacity-100 focus:opacity-100',
                  opened && 'bg-gray-200'
                )}
                onClick={toggleOpened}
                testID={AssetsSelectors.manageButton}
              >
                <ManageIcon className={svgIconClassName} />
              </Button>
            )}
          </Popper>
        </div>

        {isSyncing && filteredAssets.length === 0 ? (
          <SyncSpinner className="mt-6" />
        ) : filteredAssets.length === 0 ? (
          <div className="w-full border rounded border-gray-200">
            <p className={'text-gray-600 text-center text-xs py-6'}>
              <T id="zeroCollectibleText" />
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1">
              {filteredAssets.map(slug => (
                <CollectibleItem key={slug} assetSlug={slug} accountPkh={publicKeyHash} detailsShown={detailsShown} />
              ))}
            </div>

            {isSyncing && <SyncSpinner className="mt-6" />}
          </>
        )}
      </div>
    </div>
  );
};

interface ManageButtonDropdownProps extends PopperRenderProps {
  detailsShown: boolean;
  toggleDetailsShown: EmptyFn;
}

const ManageButtonDropdown: FC<ManageButtonDropdownProps> = ({ opened, detailsShown, toggleDetailsShown }) => {
  const buttonClassName = 'flex items-center px-3 py-2.5 rounded hover:bg-gray-200 cursor-pointer';

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right p-2 flex flex-col min-w-40"
      style={{ backgroundColor: 'white', border: 'unset', marginTop: '0.25rem' }}
    >
      <Link
        to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
        className={buttonClassName}
        testID={AssetsSelectors.dropdownManageButton}
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
          checked={detailsShown}
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
