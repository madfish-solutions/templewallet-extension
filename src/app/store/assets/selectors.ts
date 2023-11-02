import { useMemo } from 'react';

import { useSelector } from '../root-state.selector';
import { StoredCollectible, StoredToken } from './state';

type AssetsType = 'collectibles' | 'tokens';

export function useAllAssetsSelector(type: 'tokens'): StoredToken[];
export function useAllAssetsSelector(type: 'collectibles'): StoredCollectible[];
export function useAllAssetsSelector(type: AssetsType) {
  return useSelector(state => state.assets[type].data);
}

export const useAllTokensSelector = () => useSelector(state => state.assets.tokens.data);

export function useAccountAssetsSelector(account: string, chainId: string, type: 'tokens'): StoredToken[];
export function useAccountAssetsSelector(account: string, chainId: string, type: 'collectibles'): StoredCollectible[];
export function useAccountAssetsSelector(account: string, chainId: string, type: AssetsType) {
  // @ts-ignore
  const assets = useAllAssetsSelector(type);

  return useMemo(() => assets.filter(t => t.account === account && t.chainId === chainId), [assets, account, chainId]);
}

export const useAreAssetsLoading = (type: AssetsType) => useSelector(state => state.assets[type].isLoading);

export const useMainnetTokensWhitelistSelector = () => useSelector(state => state.assets.mainnetWhitelist.data);
