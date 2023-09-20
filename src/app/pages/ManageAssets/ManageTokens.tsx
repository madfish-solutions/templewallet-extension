import React, { FC, memo, useCallback, useMemo } from 'react';

import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import Checkbox from 'app/atoms/Checkbox';
import { ReactComponent as AddIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { ManageAssetsSelectors } from 'app/pages/ManageAssets/ManageAssets.selectors';
import { setTokenStatusAction } from 'app/store/assets/actions';
import { useAccountTokensAreLoadingSelector } from 'app/store/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tokens-metadata/selectors';
import { AssetIcon } from 'app/templates/AssetIcon';
import SearchAssetField from 'app/templates/SearchAssetField';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useAccountTokens } from 'lib/assets/hooks';
import { useFilteredAssetsSlugs } from 'lib/assets/use-filtered';
import { T, t } from 'lib/i18n';
import { useAssetMetadata, getAssetName, getAssetSymbol } from 'lib/metadata';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';
import { Link } from 'lib/woozie';

import styles from './ManageAssets.module.css';

export const ManageTokensContent: FC = memo(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const dispatch = useDispatch();

  const tokens = useAccountTokens(publicKeyHash, chainId);

  const managebleTokens = useMemo(
    () => tokens.reduce<string[]>((acc, { slug }) => (slug === TEMPLE_TOKEN_SLUG ? acc : acc.concat(slug)), []),
    [tokens]
  );

  const tokensAreLoading = useAccountTokensAreLoadingSelector();
  const metadatasLoading = useTokensMetadataLoadingSelector();
  const isLoading = tokensAreLoading || metadatasLoading;

  const {
    filteredAssets: managableSlugs,
    searchValue,
    setSearchValue
  } = useFilteredAssetsSlugs(managebleTokens, false);

  const confirm = useConfirm();

  const removeToken = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          title: t('deleteTokenConfirm')
        });

        if (confirmed) dispatch(setTokenStatusAction({ account: publicKeyHash, chainId, slug, status: 'removed' }));
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [chainId, publicKeyHash, confirm]
  );

  const toggleTokenStatus = useCallback(
    (slug: string, toDisable: boolean) =>
      void dispatch(
        setTokenStatusAction({ account: publicKeyHash, chainId, slug, status: toDisable ? 'disabled' : 'enabled' })
      ),
    [chainId, publicKeyHash]
  );

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div className="mb-3 w-full flex">
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
          testID={ManageAssetsSelectors.addAssetButton}
        >
          <AddIcon className="mr-1 h-5 w-auto stroke-current stroke-2" />
          <T id="addToken" />
        </Link>
      </div>

      {managableSlugs.length > 0 ? (
        <div className="flex flex-col w-full overflow-hidden border rounded-md text-gray-700 text-sm leading-tight">
          {managableSlugs.map((slug, i, arr) => {
            const last = i === arr.length - 1;
            const status = tokens.find(t => t.slug === slug)!.status;

            return (
              <ListItem
                key={slug}
                assetSlug={slug}
                last={last}
                checked={status === 'enabled'}
                onRemove={removeToken}
                onToggle={toggleTokenStatus}
              />
            );
          })}
        </div>
      ) : (
        <LoadingComponent loading={isLoading} searchValue={searchValue} />
      )}
    </div>
  );
});

type ListItemProps = {
  assetSlug: string;
  last: boolean;
  checked: boolean;
  onToggle: (slug: string, toDisable: boolean) => void;
  onRemove: (slug: string) => void;
};

const ListItem = memo<ListItemProps>(({ assetSlug, last, checked, onToggle, onRemove }) => {
  const metadata = useAssetMetadata(assetSlug);

  const onCheckboxChange = useCallback((checked: boolean) => void onToggle(assetSlug, !checked), [assetSlug, onToggle]);

  const onRemoveBtnClick = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    event => {
      event.preventDefault();
      onRemove(assetSlug);
    },
    [assetSlug, onRemove]
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
          <div className="text-sm font-normal text-gray-700 truncate w-full m-b-0.5">{getAssetName(metadata)}</div>

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
        onClick={onRemoveBtnClick}
        {...setTestID(ManageAssetsSelectors.deleteAssetButton)}
        {...setAnotherSelector('slug', assetSlug)}
      >
        <CloseIcon className="w-auto h-4 stroke-current stroke-2" title={t('delete')} />
      </div>

      <Checkbox checked={checked} onChange={onCheckboxChange} />
    </label>
  );
});

interface LoadingComponentProps {
  loading: boolean;
  searchValue: string;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({ loading, searchValue }) => {
  return loading ? null : (
    <div className="my-8 flex flex-col items-center justify-center text-gray-500">
      <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
        {Boolean(searchValue) && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

        <span {...setTestID(ManageAssetsSelectors.emptyStateText)}>
          <T id="noAssetsFound" />
        </span>
      </p>

      <p className="text-center text-xs font-light">
        <T
          id="ifYouDontSeeYourAsset"
          substitutions={[
            <b>
              <T id="addToken" />
            </b>
          ]}
        />
      </p>
    </div>
  );
};
