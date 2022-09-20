import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useSWRConfig } from 'swr';

import Money from 'app/atoms/Money';
import { ReactComponent as AddToListIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import SearchAssetField from 'app/templates/SearchAssetField';
import { T } from 'lib/i18n/react';
import {
  useAccount,
  useBalanceSWRKey,
  useChainId,
  useDisplayedFungibleTokens,
  useAssetMetadata,
  getAssetSymbol,
  getAssetName
} from 'lib/temple/front';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link, navigate } from 'lib/woozie';

import { useFilteredAssetsList } from '../../../hooks/use-filtered-assets-list';
import { AssetsSelectors } from '../Assets.selectors';
import { TezosToken } from './TezosToken';
import styles from './Tokens.module.css';

const Tokens: FC = () => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, address);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssetsList(tokens);

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
          navigate(toExploreAssetLink(activeAsset));
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

      {filteredAssets.length > 0 ? (
        <div
          className={classNames(
            'w-full overflow-hidden',
            'border rounded-md',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          <TransitionGroup key={chainId}>
            {filteredAssets.map(asset => {
              const active = activeAsset ? asset === activeAsset : false;

              return (
                <CSSTransition
                  key={asset}
                  timeout={300}
                  classNames={{
                    enter: 'opacity-0',
                    enterActive: classNames('opacity-100', 'transition ease-out duration-300'),
                    exit: classNames('opacity-0', 'transition ease-in duration-300')
                  }}
                  unmountOnExit
                >
                  <ListItem assetSlug={asset} active={active} accountPkh={account.publicKeyHash} />
                </CSSTransition>
              );
            })}
          </TransitionGroup>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default Tokens;

type ListItemProps = {
  assetSlug: string;
  active: boolean;
  accountPkh: string;
};

const ListItem = memo<ListItemProps>(({ assetSlug, active, accountPkh }) => {
  const { cache } = useSWRConfig();
  const metadata = useAssetMetadata(assetSlug);

  const balanceSWRKey = useBalanceSWRKey(assetSlug, accountPkh);
  const balanceAlreadyLoaded = useMemo(() => cache.get(balanceSWRKey) !== undefined, [cache, balanceSWRKey]);

  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(balanceAlreadyLoaded);

  const handleIntersection = useCallback(() => {
    setDisplayed(true);
  }, [setDisplayed]);

  useIntersectionDetection(toDisplayRef, handleIntersection, !displayed);

  const renderBalancInToken = useCallback(
    (balance: BigNumber) => (
      <div className="truncate text-base font-medium text-gray-800 text-right ml-4 flex-1 flex justify-end">
        <Money smallFractionFont={false}>{balance}</Money>
      </div>
    ),
    []
  );

  const renderBalanceInFiat = useCallback(
    (balance: BigNumber) => (
      <InFiat assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
        {({ balance, symbol }) => (
          <div
            className={classNames(
              'ml-1',
              'font-normal text-gray-500 text-xs flex items-center text-right truncate text-right'
            )}
          >
            <span className="mr-1">≈</span>
            {balance}
            <span className="ml-1">{symbol}</span>
          </div>
        )}
      </InFiat>
    ),
    [assetSlug]
  );

  return (
    <Link
      to={toExploreAssetLink(assetSlug)}
      className={classNames(
        'relative',
        'block w-full',
        'overflow-hidden',
        'border-b border-gray-200',
        active ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100',
        'flex items-center p-4',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none'
      )}
      testID={AssetsSelectors.AssetItemButton}
      testIDProperties={{ key: assetSlug }}
    >
      <AssetIcon assetSlug={assetSlug} size={40} className="mr-2 flex-shrink-0" />

      <div ref={toDisplayRef} className={classNames('w-full', styles.tokenInfoWidth)}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className={classNames(styles['tokenSymbol'])}>{getAssetSymbol(metadata)}</div>
            {assetSlug === 'tez' && <TezosToken />}
          </div>
          <Balance address={accountPkh} assetSlug={assetSlug} displayed={displayed}>
            {renderBalancInToken}
          </Balance>
        </div>
        <div className="flex justify-between w-full mb-1">
          <div className={classNames('text-xs font-normal text-gray-700 truncate flex-1')}>
            {getAssetName(metadata)}
          </div>
          <Balance address={accountPkh} assetSlug={assetSlug} displayed={displayed}>
            {renderBalanceInFiat}
          </Balance>
        </div>
      </div>
    </Link>
  );
});

function toExploreAssetLink(key: string) {
  return `/explore/${key}`;
}
