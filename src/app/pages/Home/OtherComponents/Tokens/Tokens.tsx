import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { BigNumber } from 'bignumber.js';
import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import { ActivitySpinner } from 'app/atoms';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/atoms/partners-promotion';
import { useAppEnv } from 'app/env';
import { useBalancesWithDecimals } from 'app/hooks/use-balances-with-decimals.hook';
import { ReactComponent as AddToListIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { loadPartnersPromoAction } from 'app/store/partners-promotion/actions';
import SearchAssetField from 'app/templates/SearchAssetField';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { T } from 'lib/i18n';
import { useAccount, useChainId, useDisplayedFungibleTokens, useFilteredAssets } from 'lib/temple/front';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { Link, navigate } from 'lib/woozie';

import { AssetsSelectors } from '../Assets.selectors';
import { ListItem } from './components/ListItem';
import { toExploreAssetLink } from './utils';

export const Tokens: FC = () => {
  const dispatch = useDispatch();
  const chainId = useChainId(true)!;
  const balances = useBalancesWithDecimals();

  const { publicKeyHash } = useAccount();
  const { isSyncing } = useSyncTokens();
  const { popup } = useAppEnv();

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, publicKeyHash);

  const tokenSlugsWithTez = useMemo(() => ['tez', ...tokens.map(({ tokenSlug }) => tokenSlug)], [tokens]);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssets(tokenSlugsWithTez);
  console.log('filteredAssets: ', filteredAssets);

  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

  const activeAssetSlug = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  const tokensView = useMemo<Array<JSX.Element>>(() => {
    const tokensJsx = filteredAssets.map(assetSlug => (
      <ListItem
        key={assetSlug}
        assetSlug={assetSlug}
        active={activeAssetSlug ? assetSlug === activeAssetSlug : false}
        balance={balances[assetSlug] ?? new BigNumber(0)}
      />
    ));

    if (filteredAssets.length < 5) {
      tokensJsx.push(<PartnersPromotion key="promo-token-item" variant={PartnersPromotionVariant.Text} />);
    } else {
      tokensJsx.splice(1, 0, <PartnersPromotion key="promo-token-item" variant={PartnersPromotionVariant.Text} />);
    }

    return tokensJsx;
  }, [filteredAssets, activeAssetSlug, balances]);

  useEffect(() => void dispatch(loadPartnersPromoAction.submit(OptimalPromoVariantEnum.Token)), []);

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
      <div className={classNames('mt-3', popup && 'mx-4')}>
        <div className="mb-3 w-full flex items-strech">
          <SearchAssetField
            value={searchValue}
            onValueChange={setSearchValue}
            onFocus={handleSearchFieldFocus}
            onBlur={handleSearchFieldBlur}
            testID={AssetsSelectors.searchAssetsInputTokens}
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
            testID={AssetsSelectors.manageButton}
          >
            <AddToListIcon className="mr-1 h-5 w-auto stroke-current stroke-2" />
            <T id="manage" />
          </Link>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-2 flex items-center justify-center text-gray-600 text-base font-light">
            {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

            <span>
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
        <div
          className={classNames(
            'w-full overflow-hidden',
            'rounded-md',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          {tokensView}
        </div>
      )}
      {isSyncing && (
        <div className="mt-4">
          <ActivitySpinner />
        </div>
      )}
    </div>
  );
};
