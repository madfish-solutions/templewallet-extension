import React, { FC, memo, useCallback } from 'react';

import classNames from 'clsx';

import Checkbox from 'app/atoms/Checkbox';
import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as ControlCentreIcon } from 'app/icons/control-centre.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import PageLayout from 'app/layouts/PageLayout';
import { ManageAssetsSelectors } from 'app/pages/ManageAssets/ManageAssets.selectors';
import { AssetIcon } from 'app/templates/AssetIcon';
import SearchAssetField from 'app/templates/SearchAssetField';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { AssetTypesEnum } from 'lib/assets/types';
import { useFilteredAssetsSlugs } from 'lib/assets/use-filtered';
import { T, t } from 'lib/i18n';
import { useAssetMetadata, getAssetName, getAssetSymbol } from 'lib/metadata';
import { setTokenStatus } from 'lib/temple/assets';
import { useAccount, useChainId, useAvailableAssetsSlugs } from 'lib/temple/front';
import { ITokenStatus } from 'lib/temple/repo';
import { useConfirm } from 'lib/ui/dialog';
import { Link } from 'lib/woozie';

import styles from './ManageAssets.module.css';

interface Props {
  assetType: string;
}

const ManageAssets: FC<Props> = ({ assetType }) => (
  <PageLayout
    pageTitle={
      <>
        <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id={assetType === AssetTypesEnum.Collectibles ? 'manageCollectibles' : 'manageTokens'} />
      </>
    }
  >
    <ManageAssetsContent assetType={assetType} />
  </PageLayout>
);

export default ManageAssets;

const ManageAssetsContent: FC<Props> = ({ assetType }) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const { availableAssets, assetsStatuses, isLoading, mutate } = useAvailableAssetsSlugs(
    assetType === AssetTypesEnum.Collectibles ? AssetTypesEnum.Collectibles : AssetTypesEnum.Tokens
  );
  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsSlugs(availableAssets, false);

  const confirm = useConfirm();

  const handleAssetUpdate = useCallback(
    async (assetSlug: string, status: ITokenStatus) => {
      try {
        if (status === ITokenStatus.Removed) {
          const confirmed = await confirm({
            title: assetType === AssetTypesEnum.Collectibles ? t('deleteCollectibleConfirm') : t('deleteTokenConfirm')
          });
          if (!confirmed) return;
        }

        await setTokenStatus(chainId, address, assetSlug, status);
        await mutate();
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [chainId, address, confirm, mutate, assetType]
  );

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div className="mb-3 w-full flex items-strech">
        <SearchAssetField
          value={searchValue}
          onValueChange={setSearchValue}
          testID={ManageAssetsSelectors.searchAssetsInput}
        />

        <Link
          to="/add-asset"
          className={classNames(
            'flex items-center ml-2 flex-shrink-0 px-3 py-1 text-gray-600 text-sm rounded overflow-hidden',
            'opacity-75 hover:bg-gray-100 hover:opacity-100 focus:opacity-100',
            'transition ease-in-out duration-200'
          )}
          testID={
            assetType === AssetTypesEnum.Collectibles
              ? ManageAssetsSelectors.addCollectiblesButton
              : ManageAssetsSelectors.addAssetButton
          }
        >
          <AddIcon className="mr-1 h-5 w-auto stroke-current stroke-2" />
          <T id={assetType === AssetTypesEnum.Collectibles ? 'addCollectible' : 'addToken'} />
        </Link>
      </div>

      {filteredAssets.length > 0 ? (
        <div className="flex flex-col w-full overflow-hidden border rounded-md text-gray-700 text-sm leading-tight">
          {filteredAssets.map((slug, i, arr) => {
            const last = i === arr.length - 1;

            return (
              <ListItem
                key={slug}
                assetSlug={slug}
                last={last}
                checked={assetsStatuses[slug]?.displayed ?? false}
                onUpdate={handleAssetUpdate}
                assetType={assetType}
              />
            );
          })}
        </div>
      ) : (
        <LoadingComponent loading={isLoading} searchValue={searchValue} assetType={assetType} />
      )}
    </div>
  );
};

type ListItemProps = {
  assetSlug: string;
  last: boolean;
  checked: boolean;
  onUpdate: (assetSlug: string, status: ITokenStatus) => void;
  assetType: string;
};

const ListItem = memo<ListItemProps>(({ assetSlug, last, checked, onUpdate }) => {
  const metadata = useAssetMetadata(assetSlug);

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onUpdate(assetSlug, checked ? ITokenStatus.Enabled : ITokenStatus.Disabled);
    },
    [assetSlug, onUpdate]
  );

  return (
    <label
      className={classNames(
        !last && 'border-b border-gray-200',
        checked ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100',
        'block w-full flex items-center py-2 px-3 text-gray-700',
        'focus:outline-none overflow-hidden cursor-pointer',
        'transition ease-in-out duration-200'
      )}
      {...setTestID(ManageAssetsSelectors.assetItem)}
      {...setAnotherSelector('slug', assetSlug)}
    >
      <AssetIcon assetSlug={assetSlug} size={32} className="mr-3 flex-shrink-0" />

      <div className={classNames('flex items-center', styles.tokenInfoWidth)}>
        <div className="flex flex-col items-start w-full">
          <div className="text-sm font-normal text-gray-700 truncate w-full" style={{ marginBottom: '0.125rem' }}>
            {getAssetName(metadata)}
          </div>

          <div className="text-xs font-light text-gray-600 truncate w-full">{getAssetSymbol(metadata)}</div>
        </div>
      </div>

      <div className="flex-1" />

      <div
        className={classNames(
          'mr-2 p-1 rounded-full text-gray-400',
          'hover:text-gray-600 hover:bg-black hover:bg-opacity-5',
          'transition ease-in-out duration-200'
        )}
        onClick={evt => {
          evt.preventDefault();
          onUpdate(assetSlug, ITokenStatus.Removed);
        }}
        {...setTestID(ManageAssetsSelectors.deleteAssetButton)}
        {...setAnotherSelector('slug', assetSlug)}
      >
        <CloseIcon className="w-auto h-4 stroke-current stroke-2" title={t('delete')} />
      </div>

      <Checkbox checked={checked} onChange={handleCheckboxChange} />
    </label>
  );
});

interface LoadingComponentProps {
  loading: boolean;
  searchValue: string;
  assetType: string;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({ loading, searchValue, assetType }) => {
  return loading ? null : (
    <div className="my-8 flex flex-col items-center justify-center text-gray-500">
      <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
        {Boolean(searchValue) && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

        <span>
          <T id="noAssetsFound" />
        </span>
      </p>

      <p className="text-center text-xs font-light">
        <T id="ifYouDontSeeYourAsset" substitutions={[<RenderAssetComponent assetType={assetType} />]} />
      </p>
    </div>
  );
};

const RenderAssetComponent: React.FC<{ assetType: string }> = ({ assetType }) => (
  <b>{assetType === AssetTypesEnum.Collectibles ? <T id={'addCollectible'} /> : <T id={'addToken'} />}</b>
);
