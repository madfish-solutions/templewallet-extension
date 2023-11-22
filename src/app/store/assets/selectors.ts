import { useMemo } from 'react';

import { useSelector } from '../root-state.selector';
import { getAccountAssetsStoreKey } from './utils';

type AssetsType = 'collectibles' | 'tokens';

export const useAllTokensSelector = () => useSelector(state => state.assets.tokens.data);

export const useAccountTokensSelector = (account: string, chainId: string) => {
  const allTokens = useAllTokensSelector();

  return useMemo(
    () => allTokens.filter(t => t.account === account && t.chainId === chainId),
    [allTokens, account, chainId]
  );
};

const ACCOUNT_COLLECTIBLES_MOCK = {};

export const useAccountCollectiblesSelector = (account: string, chainId: string) =>
  useSelector(
    state => state.assets.collectibles.data[getAccountAssetsStoreKey(account, chainId)] ?? ACCOUNT_COLLECTIBLES_MOCK
  );

export const useAreAssetsLoading = (type: AssetsType) => useSelector(state => state.assets[type].isLoading);

export const useMainnetTokensWhitelistSelector = () => useSelector(state => state.assets.mainnetWhitelist.data);
