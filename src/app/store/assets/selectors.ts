import { isEqual } from 'lodash';

import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSelector } from '../root-state.selector';

type AssetsType = 'collectibles' | 'tokens';

export const useAllAssetsSelector = (type: AssetsType) => useSelector(state => state.assets[type].data);

export const useAccountAssetsSelector = (account: string, chainId: string, type: AssetsType) => {
  const assets = useAllAssetsSelector(type);

  return useMemoWithCompare(
    () => assets.filter(t => t.account === account && t.chainId === chainId),
    [assets],
    isEqual
  );
};

export const useAreAssetsLoading = (type: AssetsType) => useSelector(state => state.assets[type].isLoading);

export const useMainnetTokensWhitelistSelector = () => useSelector(state => state.assets.mainnetWhitelist);
