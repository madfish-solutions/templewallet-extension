import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { ReactComponent as AddToListIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import SearchAssetField from 'app/templates/SearchAssetField';
import { T } from 'lib/i18n/react';
import { useAccount, useChainId, useDisplayedFungibleTokens, useBalance } from 'lib/temple/front';
import { Link, navigate } from 'lib/woozie';

import { useFilteredAssetsList } from '../../../hooks/use-filtered-assets-list';
import { useUpdatedBalances } from '../../../hooks/use-updated-balances';
import { AssetsSelectors } from '../Assets.selectors';
import { ListItem } from './components/ListItem';
import { toExploreAssetLink } from './utils';

export const TokensList: FC = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const { data: tezBalance = new BigNumber(0) } = useBalance('tez', publicKeyHash);

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, publicKeyHash);
  const tokenSlugsWithLatestBalances = useUpdatedBalances(tokens, chainId, publicKeyHash);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsList([
    { slug: 'tez', latestBalance: tezBalance },
    ...tokenSlugsWithLatestBalances
  ]);

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

  const activeAsset = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  const handleSearchFieldFocus = useCallback(() => {
    setSearchFocused(true);
  }, [setSearchFocused]);

  const handleSearchFieldBlur = useCallback(() => {
    setSearchFocused(false);
  }, [setSearchFocused]);

  useEffect(() => {
    if (!activeAsset) return;

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Enter':
          navigate(toExploreAssetLink(activeAsset.slug));
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
  }, [activeAsset, setActiveIndex]);

  return (
    <div className={classNames('w-full max-w-sm mx-auto')}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
        />

        <Link
          to="/manage-assets"
          className={classNames(
            'ml-2 flex-shrink-0',
            'px-3 py-1',
            'rounded overflow-hidden',
            'flex items-center',
            'text-gray-600 text-sm',
            'transition ease-in-out duration-200',
            'hover:bg-gray-100',
            'opacity-75 hover:opacity-100 focus:opacity-100'
          )}
          testID={AssetsSelectors.ManageButton}
        >
          <AddToListIcon className={classNames('mr-1 h-5 w-auto stroke-current stroke-2')} />
          <T id="manage" />
        </Link>
      </div>

      {filteredAssets.length === 0 ? (
        <div className={classNames('my-8', 'flex flex-col items-center justify-center', 'text-gray-500')}>
          <p className={classNames('mb-2', 'flex items-center justify-center', 'text-gray-600 text-base font-light')}>
            {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

            <span>
              <T id="noAssetsFound" />
            </span>
          </p>

          <p className={classNames('text-center text-xs font-light')}>
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
        <div
          className={classNames(
            'w-full overflow-hidden',
            'border rounded-md',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          {filteredAssets.map(asset => {
            const active = activeAsset ? asset.slug === activeAsset.slug : false;

            return (
              <ListItem key={asset.slug} assetSlug={asset.slug} active={active} latestBalance={asset.latestBalance} />
            );
          })}
        </div>
      )}
    </div>
  );
};
