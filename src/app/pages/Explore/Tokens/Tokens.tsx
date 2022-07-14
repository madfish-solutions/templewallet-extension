import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { cache } from 'swr';
import { useDebounce } from 'use-debounce';

import Money from 'app/atoms/Money';
import Spinner from 'app/atoms/Spinner/Spinner';
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
  getAssetName,
  useAllTokensBaseMetadata,
  searchAssets
} from 'lib/temple/front';
import { useFungibleTokensBalances } from 'lib/temple/front/fungible-tokens-balances';
import { TZKT_FETCH_QUERY_SIZE } from 'lib/tzkt';
import { Link, navigate } from 'lib/woozie';

import { AssetsSelectors } from '../Assets.selectors';
import { TezosToken } from './TezosToken';
import styles from './Tokens.module.css';

const Tokens: FC = () => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { hasMore, loadItems, isLoading, items } = useFungibleTokensBalances();

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, address);

  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const { assetSlugs, latestBalances } = useMemo(() => {
    const slugs = ['tez'];
    const balances: Record<string, string> = {};

    for (const { tokenSlug, latestBalance } of tokens) {
      if (tokenSlug in allTokensBaseMetadata) {
        slugs.push(tokenSlug);
      }
      if (latestBalance) {
        balances[tokenSlug] = latestBalance;
      }
    }

    return { assetSlugs: slugs, latestBalances: balances };
  }, [tokens, allTokensBaseMetadata]);

  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assetSlugs, allTokensBaseMetadata),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata]
  );

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

  useEffect(() => {
    const el = loadMoreRef.current;
    if ('IntersectionObserver' in window && el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isLoading && hasMore && items.length >= TZKT_FETCH_QUERY_SIZE) {
            loadItems();
          }
        },
        { rootMargin: '0px' }
      );

      observer.observe(el);
      return () => {
        observer.unobserve(el);
      };
    }
    return undefined;
  }, [isLoading, loadItems, hasMore, items.length]);

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
            {filteredAssets.map((asset, i, arr) => {
              const last = i === arr.length - 1;
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
                  <ListItem
                    assetSlug={asset}
                    last={last}
                    active={active}
                    accountPkh={account.publicKeyHash}
                    latestBalance={latestBalances[asset]}
                  />
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
      {hasMore && <div ref={loadMoreRef} className="w-full flex justify-center mt-5 mb-3"></div>}
      {hasMore && isLoading && <ActivitySpinner />}
    </div>
  );
};

export default Tokens;

const ActivitySpinner = memo(() => (
  <div className="w-full flex items-center justify-center overflow-hidden" style={{ height: '21px' }}>
    <Spinner theme="gray" className="w-16" />
  </div>
));

type ListItemProps = {
  assetSlug: string;
  last: boolean;
  active: boolean;
  accountPkh: string;
  latestBalance?: string;
};

const ListItem = memo<ListItemProps>(({ assetSlug, last, active, accountPkh }) => {
  const metadata = useAssetMetadata(assetSlug);

  const balanceSWRKey = useBalanceSWRKey(assetSlug, accountPkh);
  const balanceAlreadyLoaded = useMemo(() => cache.has(balanceSWRKey), [balanceSWRKey]);

  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(balanceAlreadyLoaded);

  useEffect(() => {
    const el = toDisplayRef.current;
    if (!displayed && 'IntersectionObserver' in window && el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setDisplayed(true);
          }
        },
        { rootMargin: '0px' }
      );

      observer.observe(el);
      return () => {
        observer.unobserve(el);
      };
    }
    return undefined;
  }, [displayed, setDisplayed]);

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
        !last && 'border-b border-gray-200',
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
