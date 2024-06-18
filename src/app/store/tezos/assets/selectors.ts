import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { useSelector } from '../../root-state.selector';

import { getAccountAssetsStoreKey } from './utils';

type AssetsType = 'collectibles' | 'tokens';

export const useAllTokensSelector = () => useSelector(state => state.assets.tokens.data);

export const useChainAccountTokensSelector = (account: string, chainId: string) =>
  useSelector(state => state.assets.tokens.data[getAccountAssetsStoreKey(account, chainId)] ?? EMPTY_FROZEN_OBJ);

export const useAccountCollectiblesSelector = (account: string, chainId: string) =>
  useSelector(state => state.assets.collectibles.data[getAccountAssetsStoreKey(account, chainId)] ?? EMPTY_FROZEN_OBJ);

export const useAreAssetsLoading = (type: AssetsType) => useSelector(state => state.assets[type].isLoading);

export const useMainnetTokensWhitelistSelector = () => useSelector(state => state.assets.mainnetWhitelist.data);

export const useMainnetTokensScamlistSelector = () => useSelector(state => state.assets.mainnetScamlist.data);
