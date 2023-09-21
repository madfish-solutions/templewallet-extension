import { isEqual } from 'lodash';

import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSelector } from '../root-state.selector';

export const useAccountAssetsSelector = (account: string, chainId: string, collectibles?: boolean) => {
  const allAssets = useSelector(state => state.assets[collectibles ? 'collectibles' : 'tokens'].data);

  return useMemoWithCompare(
    () => allAssets.filter(t => t.account === account && t.chainId === chainId),
    [allAssets],
    isEqual
  );
};

export const useAreAssetsLoading = (collectibles?: boolean) =>
  useSelector(state => state.assets[collectibles ? 'collectibles' : 'tokens'].isLoading);

export const useMainnetTokensWhitelistSelector = () => useSelector(state => state.assets.mainnetWhitelist);
