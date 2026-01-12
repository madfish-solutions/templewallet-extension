import { useMemo } from 'react';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useWindowIsActive } from 'lib/temple/front/window-is-active-context';
import { useLocation } from 'lib/woozie';
import { TempleChainKind } from 'temple/types';

const TEZOS_RELEVANT_PATHS = [
  '/send',
  '/swap',
  '/token',
  '/collectible',
  '/activity',
  '/earn-tez',
  '/earn-tkey',
  '/rewards'
];

const ASSET_PATH_PREFIXES = ['/token/', '/collectible/'] as const;

const isAssetPath = (pathname: string) => ASSET_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));

const getChainKindFromAssetPath = (pathname: string): string | undefined => pathname.split('/')[2];

export const useShouldLoadTezosData = () => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const windowIsActive = useWindowIsActive();
  const { pathname } = useLocation();

  return useMemo(() => {
    if (!windowIsActive) return false;

    if (pathname === '/') {
      return !filterChain || filterChain.kind === TempleChainKind.Tezos;
    }

    if (isAssetPath(pathname)) {
      return getChainKindFromAssetPath(pathname) === TempleChainKind.Tezos;
    }

    return TEZOS_RELEVANT_PATHS.some(path => pathname.startsWith(path));
  }, [windowIsActive, filterChain, pathname]);
};
