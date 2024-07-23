import { useSelector } from 'app/store/root-state.selector';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { StoredTezosAsset } from './state';
import { getAccountAssetsStoreKey } from './utils';

type AssetsType = 'collectibles' | 'tokens';

export const useAllTokensSelector = () => useSelector(state => state.assets.tokens.data);

export const useChainAccountTokensSelector = (account: string, chainId: string) =>
  useSelector(state => state.assets.tokens.data[getAccountAssetsStoreKey(account, chainId)] ?? EMPTY_FROZEN_OBJ);

export const useStoredTezosTokenSelector = (
  account: string,
  chainId: string,
  assetSlug: string
): StoredTezosAsset | undefined =>
  useSelector(state => state.assets.tokens.data[getAccountAssetsStoreKey(account, chainId)]?.[assetSlug]);

export const useAllCollectiblesSelector = () => useSelector(state => state.assets.collectibles.data);

export const useChainAccountCollectiblesSelector = (account: string, chainId: string) =>
  useSelector(state => state.assets.collectibles.data[getAccountAssetsStoreKey(account, chainId)] ?? EMPTY_FROZEN_OBJ);

export const useStoredTezosCollectibleSelector = (
  account: string,
  chainId: string,
  assetSlug: string
): StoredTezosAsset | undefined =>
  useSelector(state => state.assets.collectibles.data[getAccountAssetsStoreKey(account, chainId)]?.[assetSlug]);

export const useAreAssetsLoading = (type: AssetsType) => useSelector(state => state.assets[type].isLoading);

export const useMainnetTokensWhitelistSelector = () => useSelector(state => state.assets.mainnetWhitelist.data);

export const useMainnetTokensScamlistSelector = () => useSelector(state => state.assets.mainnetScamlist.data);
