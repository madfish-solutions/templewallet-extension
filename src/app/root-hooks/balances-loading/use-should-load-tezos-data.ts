import { useMemo } from 'react';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useWindowIsActive } from 'lib/temple/front/window-is-active-context';
import { useLocation } from 'lib/woozie';
import { TempleChainKind } from 'temple/types';

const TEZOS_ONLY_PATHS = ['/swap', '/earn-tez', '/earn-tkey', '/rewards'] as const;
const CHAIN_PARAM_PATHS = ['/send', '/token', '/collectible'] as const;

const getChainKindFromPath = (pathname: string): TempleChainKind | undefined => {
  const chainKind = pathname.split('/')[2];

  if (chainKind === TempleChainKind.Tezos || chainKind === TempleChainKind.EVM) {
    return chainKind;
  }

  return undefined;
};

const startsWithAny = (pathname: string, paths: readonly string[]) => paths.some(path => pathname.startsWith(path));

const isTezosFilterActive = (filterChain: { kind: TempleChainKind } | null) =>
  !filterChain || filterChain.kind === TempleChainKind.Tezos;

export const useShouldLoadTezosData = () => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const windowIsActive = useWindowIsActive();
  const { pathname } = useLocation();

  return useMemo(() => {
    if (!windowIsActive) return false;

    if (startsWithAny(pathname, TEZOS_ONLY_PATHS)) {
      return true;
    }

    if (startsWithAny(pathname, CHAIN_PARAM_PATHS)) {
      const chainKind = getChainKindFromPath(pathname);
      return chainKind ? chainKind === TempleChainKind.Tezos : isTezosFilterActive(filterChain);
    }

    return isTezosFilterActive(filterChain);
  }, [windowIsActive, filterChain, pathname]);
};
