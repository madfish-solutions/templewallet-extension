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

export const useShouldLoadTezosData = () => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const windowIsActive = useWindowIsActive();
  const { pathname } = useLocation();

  const isOnTezosAssetPage = useMemo(() => {
    if (pathname.startsWith('/token/') || pathname.startsWith('/collectible/')) {
      const parts = pathname.split('/');
      const chainKind = parts[2];

      return chainKind === TempleChainKind.Tezos;
    }
    return false;
  }, [pathname]);

  const shouldLoad = useMemo(() => {
    if (!windowIsActive) return false;

    if (pathname === '/') {
      return !filterChain || filterChain.kind === TempleChainKind.Tezos;
    }

    const isRelevantPath = TEZOS_RELEVANT_PATHS.some(path => pathname.startsWith(path));

    if (!isRelevantPath) {
      return false;
    }

    if (pathname.startsWith('/token/') || pathname.startsWith('/collectible/')) {
      return isOnTezosAssetPage;
    }

    return true;
  }, [windowIsActive, filterChain, pathname, isOnTezosAssetPage]);

  return shouldLoad;
};
